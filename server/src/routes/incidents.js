const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const Project = require('../models/Project');
const aiService = require('../services/aiService');
const { protect } = require('../middleware/auth');

router.use(protect);

// Get all incidents for user's projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.userId }).select('_id');
    const projectIds = projects.map((p) => p._id);

    const incidents = await Incident.find({ project: { $in: projectIds } })
      .populate('project', 'name')
      .sort({ startedAt: -1 })
      .limit(50);

    res.json({ success: true, data: incidents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single incident
router.get('/:id', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).populate('project');
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create incident (triggered by monitoring job)
router.post('/', async (req, res) => {
  try {
    const { projectId, title, severity, symptoms, timeline, relatedDeployment } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ success: false, message: 'projectId and title required' });
    }

    const incident = await Incident.create({
      project: projectId,
      title,
      severity: severity || 'warning',
      symptoms: symptoms || [],
      timeline: timeline || [],
      relatedDeployment: relatedDeployment || {},
    });

    // Trigger AI investigation
    const aiResult = await aiService.investigate({
      title,
      severity: incident.severity,
      startedAt: incident.startedAt.toISOString(),
      symptoms: incident.symptoms,
      timeline: incident.timeline,
      relatedDeployment: incident.relatedDeployment,
    });

    incident.aiAnalysis = {
      ...aiResult.analysis,
      generatedAt: new Date(),
    };
    await incident.save();

    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Acknowledge incident
router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status: 'acknowledged', acknowledgedAt: new Date() },
      { new: true }
    );
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Resolve incident
router.patch('/:id/resolve', async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: req.userId,
        resolutionNotes: req.body.notes || '',
      },
      { new: true }
    );
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;