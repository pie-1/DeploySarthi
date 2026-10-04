const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const Project = require('../models/Project');
const aiService = require('../services/aiService');
const { broadcast } = require('../services/wsServer');
const { protect } = require('../middleware/auth');

router.use(protect);

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

router.post('/', async (req, res) => {
  try {
    const { projectId, title, severity, symptoms, timeline, relatedDeployment } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ success: false, message: 'projectId and title required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const incident = await Incident.create({
      project: projectId,
      title,
      severity: severity || 'warning',
      symptoms: symptoms || [],
      timeline: timeline || [],
      relatedDeployment: relatedDeployment || {},
    });

    broadcast('incident:created', {
      _id: incident._id,
      title: incident.title,
      severity: incident.severity,
      startedAt: incident.startedAt,
      project: { name: project.name },
      symptoms: incident.symptoms,
      aiAnalysis: incident.aiAnalysis,
    });

    // AI investigation async
    (async () => {
      try {
        const aiResult = await aiService.investigate({
          title: incident.title,
          severity: incident.severity,
          startedAt: incident.startedAt.toISOString(),
          symptoms: incident.symptoms,
          timeline: incident.timeline,
          relatedDeployment: incident.relatedDeployment,
        });

        incident.aiAnalysis = { ...aiResult.analysis, generatedAt: new Date() };
        incident.timeline.push({
          timestamp: new Date().toISOString(),
          service: 'ai',
          event: 'AI investigation completed',
        });
        await incident.save();

        broadcast('incident:analyzed', {
          _id: incident._id,
          aiAnalysis: incident.aiAnalysis,
          timeline: incident.timeline,
        });
      } catch (err) {
        console.error('[ai] failed:', err.message);
      }
    })();

    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status: 'acknowledged', acknowledgedAt: new Date() },
      { returnDocument: 'after' }
    );
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    broadcast('incident:updated', {
      _id: incident._id,
      status: incident.status,
    });

    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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
      { returnDocument: 'after' }
    );
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    broadcast('incident:updated', {
      _id: incident._id,
      status: incident.status,
    });

    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;