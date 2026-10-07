const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const readinessService = require('../services/readinessService');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/:projectId/check', async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      owner: req.userId,
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (!project.githubRepo) {
      return res.status(400).json({
        success: false,
        message: 'Project has no GitHub repository linked',
      });
    }

    const report = await readinessService.checkRepository(
      project.githubRepo,
      project.githubDefaultBranch || 'main'
    );

    // Persist report on project
    await Project.findByIdAndUpdate(project._id, {
      $set: {
        readiness: {
          ...report,
          runAt: new Date(),
        },
      },
    });

    res.json({ success: true, data: report });
  } catch (err) {
    console.error('[readiness] error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:projectId', async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      owner: req.userId,
    }).select('readiness');

    res.json({ success: true, data: project?.readiness || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;