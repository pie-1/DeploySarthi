const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Incident = require('../models/Incident');
const { protect } = require('../middleware/auth');

router.use(protect);

/**
 * GET /api/dashboard/summary
 * One aggregated endpoint for the whole dashboard.
 */
router.get('/summary', async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.userId }).sort({ createdAt: -1 });
    const projectIds = projects.map((p) => p._id);

    const now = Date.now();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    const [allIncidents, recentIncidents, unresolvedCritical, unresolvedWarnings] = await Promise.all([
      Incident.countDocuments({ project: { $in: projectIds } }),
      Incident.find({ project: { $in: projectIds }, startedAt: { $gte: oneDayAgo } })
        .populate('project', 'name')
        .sort({ startedAt: -1 })
        .limit(20),
      Incident.countDocuments({ project: { $in: projectIds }, status: 'open', severity: 'critical' }),
      Incident.countDocuments({ project: { $in: projectIds }, status: 'open', severity: 'warning' }),
    ]);

    // ─── Needs attention ────────────────────────────────────
    const needsAttention = await Incident.find({
      project: { $in: projectIds },
      status: 'open',
    })
      .populate('project', 'name')
      .sort({ severity: -1, startedAt: -1 })
      .limit(5);

    // ─── Per-project health ─────────────────────────────────
    const perProject = await Promise.all(
      projects.map(async (p) => {
        const activeIncidents = await Incident.countDocuments({
          project: p._id,
          status: 'open',
        });

        const recentCount = await Incident.countDocuments({
          project: p._id,
          startedAt: { $gte: oneDayAgo },
        });

        let status = 'healthy';
        if (activeIncidents > 0) {
          const hasCritical = await Incident.exists({
            project: p._id,
            status: 'open',
            severity: 'critical',
          });
          status = hasCritical ? 'critical' : 'warning';
        }

        return {
          _id: p._id,
          name: p.name,
          status,
          activeIncidents,
          recentIncidents24h: recentCount,
          lastDeployedAt: p.lastDeployedAt,
          githubRepo: p.githubRepo,
          vercelProjectName: p.vercelProjectName,
          environment: p.environment,
          deploymentTarget: p.deploymentTarget,
        };
      })
    );

    // ─── Recent activity feed ───────────────────────────────
    const activity = [];

    // Recent incidents
    recentIncidents.slice(0, 8).forEach((i) => {
      activity.push({
        type: 'incident',
        timestamp: i.startedAt,
        title: i.title,
        severity: i.severity,
        link: `/incidents/${i._id}`,
        meta: { projectName: i.project?.name },
      });
    });

    // Recent projects (deployments)
    projects.slice(0, 3).forEach((p) => {
      if (p.lastDeployedAt) {
        activity.push({
          type: 'deployment',
          timestamp: p.lastDeployedAt,
          title: `Deployed ${p.name}`,
          link: `/projects/${p._id}`,
          meta: { projectName: p.name },
        });
      }
    });

    activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // ─── Cost today (from last incident costImpact, rough) ──
    const todayIncidents = recentIncidents.filter(
      (i) => new Date(i.startedAt) >= oneDayAgo
    );
    const costToday = todayIncidents.reduce(
      (sum, i) => sum + (i.costImpact?.costPerHour || 0),
      0
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalProjects: projects.length,
          totalIncidents: allIncidents,
          activeCritical: unresolvedCritical,
          activeWarnings: unresolvedWarnings,
          lastIncidentAt: recentIncidents[0]?.startedAt || null,
          overallStatus:
            unresolvedCritical > 0
              ? 'critical'
              : unresolvedWarnings > 0
              ? 'warning'
              : 'healthy',
        },
        needsAttention: needsAttention.map((i) => ({
          _id: i._id,
          title: i.title,
          severity: i.severity,
          startedAt: i.startedAt,
          projectName: i.project?.name,
        })),
        projects: perProject,
        activity: activity.slice(0, 10),
        cost: {
          today: Math.round(costToday * 100) / 100,
          currency: 'USD',
        },
      },
    });
  } catch (err) {
    console.error('[dashboard/summary] error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;