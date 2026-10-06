const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const Incident = require('../models/Incident');
const { protect } = require('../middleware/auth');

router.use(protect);

/**
 * Get profile summary with real stats
 * GET /api/users/profile
 */
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    const projects = await Project.find({ owner: req.userId }).select('_id name createdAt');

    const projectIds = projects.map((p) => p._id);

    const [totalIncidents, resolvedIncidents, activeIncidents] = await Promise.all([
      Incident.countDocuments({ project: { $in: projectIds } }),
      Incident.countDocuments({ project: { $in: projectIds }, status: 'resolved' }),
      Incident.countDocuments({ project: { $in: projectIds }, status: 'open' }),
    ]);

    res.json({
      success: true,
      data: {
        user,
        stats: {
          projects: projects.length,
          incidents: totalIncidents,
          resolvedIncidents,
          activeIncidents,
          githubConnected: !!user.github?.connected,
          vercelConnected: !!user.vercel?.connected,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Update user preferences (notifications)
 * PATCH /api/users/preferences
 */
router.patch('/preferences', async (req, res) => {
  try {
    const { notifications } = req.body;

    const update = {};
    if (notifications) {
      if (typeof notifications.whatsappEnabled === 'boolean') {
        update['notifications.whatsappEnabled'] = notifications.whatsappEnabled;
      }
      if (typeof notifications.emailEnabled === 'boolean') {
        update['notifications.emailEnabled'] = notifications.emailEnabled;
      }
      if (typeof notifications.criticalOnly === 'boolean') {
        update['notifications.criticalOnly'] = notifications.criticalOnly;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: update },
      { returnDocument: 'after' }
    ).select('-password');

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Update basic profile fields (name, phone)
 * PATCH /api/users/profile
 */
router.patch('/profile', async (req, res) => {
  try {
    const { name, phone } = req.body;

    const update = {};
    if (name) update.name = name.trim();
    if (typeof phone === 'string') {
      const digits = phone.replace(/\D/g, '');
      if (digits && digits.length !== 10) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be exactly 10 digits',
        });
      }
      update.phone = digits;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: update },
      { returnDocument: 'after' }
    ).select('-password');

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get recent activity feed
 * GET /api/users/activity?limit=10
 */
router.get('/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const projects = await Project.find({ owner: req.userId })
      .sort({ updatedAt: -1 })
      .limit(limit);
    const projectIds = projects.map((p) => p._id);

    const incidents = await Incident.find({ project: { $in: projectIds } })
      .populate('project', 'name')
      .sort({ startedAt: -1 })
      .limit(limit);

    // Merge + sort by date
    const activities = [
      ...projects.map((p) => ({
        type: 'project_created',
        title: `Created project "${p.name}"`,
        timestamp: p.createdAt,
        meta: { projectId: p._id },
      })),
      ...incidents.map((i) => ({
        type: i.status === 'resolved' ? 'incident_resolved' : 'incident_created',
        title:
          i.status === 'resolved'
            ? `Resolved incident: ${i.title}`
            : `New incident: ${i.title}`,
        timestamp: i.status === 'resolved' ? i.resolvedAt : i.startedAt,
        meta: { incidentId: i._id, severity: i.severity },
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({ success: true, data: activities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;