const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Incident = require('../models/Incident');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.userId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const incidents = await Incident.find({ project: project._id })
      .sort({ startedAt: -1 })
      .limit(20);
    res.json({ success: true, data: { project, incidents } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name, description,
      githubRepo, githubRepoId, githubDefaultBranch,
      githubLanguage, githubStars, githubIsPrivate,
      vercelProjectId, vercelProjectName, vercelUrl, vercelFramework,
      deploymentTarget, environment,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const project = await Project.create({
      name,
      description: description || '',
      githubRepo: githubRepo || '',
      githubRepoId: githubRepoId || undefined,
      githubDefaultBranch: githubDefaultBranch || 'main',
      githubLanguage: githubLanguage || '',
      githubStars: githubStars || 0,
      githubIsPrivate: githubIsPrivate || false,
      vercelProjectId: vercelProjectId || '',
      vercelProjectName: vercelProjectName || '',
      vercelUrl: vercelUrl || '',
      vercelFramework: vercelFramework || '',
      deploymentTarget: deploymentTarget || 'none',
      environment: environment || 'development',
      owner: req.userId,
    });

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    await Incident.deleteMany({ project: project._id });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;