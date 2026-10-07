/**
 * Repository readiness check.
 *
 * Runs a set of checks on a GitHub repository to identify common
 * deployment failure causes before they reach production.
 *
 * Uses GitHub Contents API to fetch package.json, .env.example, etc.
 */

const githubService = require('./githubService');

const CHECKS = [
  'environment_variables',
  'framework_detection',
  'build_command',
  'health_endpoint',
  'runtime_version',
  'security_scan',
  'cost_risks',
];

/**
 * Fetch a file from a repo. Returns null if 404.
 */
async function fetchFile(repoFullName, path, ref = 'main') {
  try {
    const token = process.env.GITHUB_TOKEN || null;
    const res = await githubService.getContents(repoFullName, path, ref, token);
    return res;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

function detectFramework(packageJson) {
  if (!packageJson) return { framework: 'unknown', confidence: 'low' };

  const deps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };

  if (deps.next) return { framework: 'nextjs', confidence: 'high' };
  if (deps.nuxt) return { framework: 'nuxtjs', confidence: 'high' };
  if (deps.astro) return { framework: 'astro', confidence: 'high' };
  if (deps['@remix-run/react']) return { framework: 'remix', confidence: 'high' };
  if (deps['@sveltejs/kit']) return { framework: 'svelte', confidence: 'high' };
  if (deps['@angular/core']) return { framework: 'angular', confidence: 'high' };
  if (deps.vue) return { framework: 'vue', confidence: 'high' };
  if (deps.vite) return { framework: 'vite', confidence: 'high' };
  if (deps['react-scripts']) return { framework: 'create-react-app', confidence: 'high' };
  if (deps.express || deps.fastify || deps.koa) {
    return { framework: 'nodejs-api', confidence: 'medium' };
  }
  if (packageJson.scripts?.start) {
    return { framework: 'nodejs', confidence: 'low' };
  }
  return { framework: 'unknown', confidence: 'low' };
}

/**
 * Run all readiness checks for a repository.
 * Returns { findings: [], score: 0-100 }
 */
async function checkRepository(repoFullName, ref = 'main') {
  const findings = [];

  // ─── 1. Fetch key files ───────────────────────────────────
  const [packageJsonFile, envExample, gitignore, readme] = await Promise.all([
    fetchFile(repoFullName, 'package.json', ref).catch(() => null),
    fetchFile(repoFullName, '.env.example', ref).catch(() => null),
    fetchFile(repoFullName, '.gitignore', ref).catch(() => null),
    fetchFile(repoFullName, 'README.md', ref).catch(() => null),
  ]);

  let packageJson = null;
  if (packageJsonFile?.content) {
    try {
      const decoded = Buffer.from(packageJsonFile.content, 'base64').toString('utf-8');
      packageJson = JSON.parse(decoded);
    } catch {}
  }

  // ─── 2. Framework detection ───────────────────────────────
  const { framework, confidence } = detectFramework(packageJson);
  findings.push({
    check: 'framework_detection',
    severity: framework === 'unknown' ? 'warning' : 'pass',
    title: 'Framework detection',
    detail: framework === 'unknown'
      ? 'Could not detect a known framework. Vercel will attempt auto-detection.'
      : `Detected ${framework} (${confidence} confidence)`,
    remediation: framework === 'unknown'
      ? 'Add a build script and dependencies to package.json'
      : null,
  });

  // ─── 3. Environment variables ─────────────────────────────
  const hasPackageJson = !!packageJson;
  const hasEnvExample = !!envExample;

  if (!hasPackageJson) {
    findings.push({
      check: 'environment_variables',
      severity: 'skip',
      title: 'Environment variables',
      detail: 'No package.json — could not check for env usage',
    });
  } else if (!hasEnvExample) {
    findings.push({
      check: 'environment_variables',
      severity: 'warning',
      title: 'Environment variables',
      detail: 'No .env.example file found. It is unclear what environment variables the app needs.',
      remediation: 'Add a .env.example listing all required variables (no secrets)',
    });
  } else {
    findings.push({
      check: 'environment_variables',
      severity: 'pass',
      title: 'Environment variables',
      detail: '.env.example found — environment setup is documented',
    });
  }

  // ─── 4. Build command ─────────────────────────────────────
  if (packageJson) {
    const hasBuild = !!packageJson.scripts?.build;
    findings.push({
      check: 'build_command',
      severity: hasBuild ? 'pass' : (framework === 'nodejs-api' ? 'pass' : 'warning'),
      title: 'Build command',
      detail: hasBuild
        ? `Build script defined: "${packageJson.scripts.build}"`
        : 'No build script in package.json',
      remediation: hasBuild ? null : 'Add "build" script to package.json',
    });
  }

  // ─── 5. Runtime version ───────────────────────────────────
  if (packageJson) {
    const nodeVersion = packageJson.engines?.node;
    findings.push({
      check: 'runtime_version',
      severity: nodeVersion ? 'pass' : 'warning',
      title: 'Runtime version',
      detail: nodeVersion
        ? `Node ${nodeVersion} specified in engines`
        : 'No Node version specified in package.json engines',
      remediation: nodeVersion
        ? null
        : 'Add "engines": { "node": ">=20" } to package.json',
    });
  }

  // ─── 6. Security scan (basic) ─────────────────────────────
  const securityFindings = [];
  if (packageJsonFile?.content) {
    const raw = Buffer.from(packageJsonFile.content, 'base64').toString('utf-8');
    // Basic heuristics — no real secrets scanner
    if (/sk-[a-z0-9]{20,}/i.test(raw)) securityFindings.push('Possible API key in package.json');
    if (/"password"\s*:\s*"/.test(raw)) securityFindings.push('Hardcoded password in package.json');
  }

  findings.push({
    check: 'security_scan',
    severity: securityFindings.length > 0 ? 'critical' : 'pass',
    title: 'Security scan',
    detail: securityFindings.length > 0
      ? securityFindings.join('; ')
      : 'No obvious secrets detected in key files',
    remediation: securityFindings.length > 0
      ? 'Remove secrets from code and use environment variables'
      : null,
  });

  // ─── 7. Cost risks (heuristic) ────────────────────────────
  const costRisks = [];
  if (packageJson) {
    const deps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };
    if (deps['@aws-sdk/client-cloudwatch'] && !packageJson.config?.logRetention) {
      costRisks.push('CloudWatch SDK detected — configure log retention to avoid runaway costs');
    }
    if (deps['aws-sdk'] || deps['@aws-sdk/client-s3']) {
      costRisks.push('AWS SDK detected — review S3/CloudWatch usage for cost surprises');
    }
    if (deps['node-cron'] || deps['cron']) {
      costRisks.push('Cron jobs detected — ensure schedule does not run excessively');
    }
  }

  findings.push({
    check: 'cost_risks',
    severity: costRisks.length > 0 ? 'warning' : 'pass',
    title: 'Cost risks',
    detail: costRisks.length > 0
      ? costRisks.join('; ')
      : 'No obvious cost risk patterns detected',
    remediation: costRisks.length > 0
      ? 'Review your cloud provider billing and set budget alerts'
      : null,
  });

  // ─── 8. .gitignore sanity ─────────────────────────────────
  if (hasPackageJson && !gitignore) {
    findings.push({
      check: 'gitignore',
      severity: 'warning',
      title: '.gitignore',
      detail: 'No .gitignore found — you may commit node_modules',
      remediation: 'Add a .gitignore with node_modules/, .env, dist/',
    });
  }

  // ─── Score ────────────────────────────────────────────────
  const graded = findings.filter((f) => f.severity !== 'skip');
  const passCount = graded.filter((f) => f.severity === 'pass').length;
  const criticalCount = graded.filter((f) => f.severity === 'critical').length;
  const warningCount = graded.filter((f) => f.severity === 'warning').length;

  let score = 100;
  score -= criticalCount * 30;
  score -= warningCount * 10;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    framework,
    summary: {
      total: graded.length,
      passed: passCount,
      warnings: warningCount,
      critical: criticalCount,
    },
    findings,
    checkedAt: new Date().toISOString(),
  };
}

module.exports = { checkRepository, CHECKS };