const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Incident = require('../models/Incident');
const aiService = require('../services/aiService');
const { buildIncidentContext } = require('../services/contextBuilder');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/health', async (req, res) => {
  const result = await aiService.health();
  res.json({ success: true, data: result });
});

router.post('/detect', async (req, res) => {
  try {
    const { metrics } = req.body;
    if (!metrics) {
      return res.status(400).json({ success: false, message: 'metrics required' });
    }
    const result = await aiService.detect(metrics);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Investigate endpoint — builds rich context automatically.
 */
router.post('/investigate', async (req, res) => {
  try {
    const {
      incidentId,
      projectId,
      context: providedContext,
      ...incident
    } = req.body;

    let enrichedContext = providedContext;
    let finalProjectId = projectId;

    // If no projectId, try to look it up from the incident
    if (!finalProjectId && incidentId) {
      try {
        const found = await Incident.findById(incidentId);
        if (found) {
          finalProjectId = found.project;
          console.log('[ai] Resolved projectId from incidentId');
        }
      } catch (err) {
        console.error('[ai] Failed to look up incident:', err.message);
      }
    }

    // Build context if we have a projectId and no provided context
    if (!enrichedContext && finalProjectId) {
      try {
        const project = await Project.findById(finalProjectId);
        if (project) {
          // Add merged incident data for context
          const incidentData = {
            ...incident,
            symptoms: incident.symptoms || [],
            timeline: incident.timeline || [],
          };
          enrichedContext = await buildIncidentContext(project, incidentData);
          console.log(
            `[ai] On-demand context built: ${enrichedContext.recentDeployments.length} deploys, ${enrichedContext.recentCommits.length} commits`
          );
        }
      } catch (err) {
        console.error('[ai] Failed to build context:', err.message);
      }
    } else if (enrichedContext) {
      console.log(
        `[ai] Using provided context: ${enrichedContext.recentDeployments?.length || 0} deploys, ${enrichedContext.recentCommits?.length || 0} commits`
      );
    } else {
      console.log('[ai] No context available — analyzing without it');
    }

    const result = await aiService.investigate({
      ...incident,
      context: enrichedContext || {},
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[ai] /investigate error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/suggest-prompts', async (req, res) => {
  try {
    const result = await aiService.suggestPrompts(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;