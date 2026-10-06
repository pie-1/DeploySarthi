const vercelService = require('./vercelService');
const githubService = require('./githubService');

/**
 * Build rich context for AI investigation.
 * Fetches recent deployments + commits related to the incident.
 */
async function buildIncidentContext(project, incident) {
  const context = {
    project: {
      name: project.name,
      description: project.description || '',
      environment: project.environment,
      deploymentTarget: project.deploymentTarget,
      githubRepo: project.githubRepo || '',
      vercelProjectName: project.vercelProjectName || '',
      vercelUrl: project.vercelUrl || '',
    },
    incident: {
      title: incident.title,
      severity: incident.severity,
      startedAt: incident.startedAt,
      symptoms: incident.symptoms || [],
      timeline: incident.timeline || [],
    },
    recentDeployments: [],
    recentCommits: [],
  };

  // Fetch recent Vercel deployments
  if (project.vercelProjectId) {
    try {
      const deployments = await vercelService.listDeployments(
        project.vercelProjectId,
        null,
        5
      );
      context.recentDeployments = deployments.map((d) => ({
        state: d.state,
        target: d.target,
        createdAt: d.createdAt,
        commitSha: d.commit?.shortSha || '',
        commitMessage: d.commit?.message || '',
        commitAuthor: d.commit?.author || '',
      }));
      console.log(`[context] Fetched ${context.recentDeployments.length} deployments`);
    } catch (err) {
      console.error('[context] Failed to fetch deployments:', err.message);
    }
  }

  // Fetch recent GitHub commits
  if (project.githubRepo) {
    try {
      const commits = await githubService.listCommits(project.githubRepo, {
        limit: 5,
      });
      context.recentCommits = commits.map((c) => ({
        sha: c.shortSha,
        message: c.message,
        author: c.author,
        date: c.date,
      }));
      console.log(`[context] Fetched ${context.recentCommits.length} commits`);
    } catch (err) {
      console.error('[context] Failed to fetch commits:', err.message);
    }
  }

  return context;
}

/**
 * Format context into a text summary for the LLM prompt.
 */
function formatContextForLLM(context) {
  const lines = [];

  lines.push(`## Project`);
  lines.push(`- Name: ${context.project.name}`);
  lines.push(`- Environment: ${context.project.environment}`);
  lines.push(`- Deployment target: ${context.project.deploymentTarget}`);
  if (context.project.githubRepo) {
    lines.push(`- GitHub repo: ${context.project.githubRepo}`);
  }
  if (context.project.vercelProjectName) {
    lines.push(`- Vercel project: ${context.project.vercelProjectName}`);
  }

  lines.push(`\n## Incident`);
  lines.push(`- Title: ${context.incident.title}`);
  lines.push(`- Severity: ${context.incident.severity}`);
  lines.push(`- Started at: ${context.incident.startedAt}`);

  if (context.incident.symptoms.length > 0) {
    lines.push(`\n## Symptoms Observed`);
    context.incident.symptoms.forEach((s) => {
      const arrow = s.changePercent > 0 ? 'UP' : 'DOWN';
      lines.push(
        `- ${s.service} ${s.metric}: ${s.value} (baseline ${s.baseline}, ${arrow} ${Math.abs(s.changePercent).toFixed(1)}%)`
      );
    });
  }

  if (context.incident.timeline.length > 0) {
    lines.push(`\n## Incident Timeline`);
    context.incident.timeline.forEach((t) => {
      lines.push(`- ${t.timestamp} [${t.service}] ${t.event}`);
    });
  }

  if (context.recentDeployments.length > 0) {
    lines.push(`\n## Recent Vercel Deployments (last 5)`);
    context.recentDeployments.forEach((d) => {
      lines.push(
        `- ${d.createdAt} · ${d.state} (${d.target}) · commit ${d.commitSha}: "${d.commitMessage}" by ${d.commitAuthor}`
      );
    });
  } else {
    lines.push(`\n## Recent Deployments`);
    lines.push(`- None available`);
  }

  if (context.recentCommits.length > 0) {
    lines.push(`\n## Recent GitHub Commits (last 5)`);
    context.recentCommits.forEach((c) => {
      lines.push(`- ${c.date} · ${c.sha} by ${c.author}: "${c.message}"`);
    });
  } else {
    lines.push(`\n## Recent Commits`);
    lines.push(`- None available`);
  }

  return lines.join('\n');
}

module.exports = { buildIncidentContext, formatContextForLLM };