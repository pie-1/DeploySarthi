import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket, Zap, Code, Shield, HelpCircle, Terminal, ArrowRight,
  CheckCircle2, Database, GitBranch, Server, Activity,
  Cpu, Cloud, AlertTriangle, Brain, Bell, Layers,
  Copy, Check,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: Layers },
  { id: 'quickstart', label: 'Quick Start', icon: Rocket },
  { id: 'concepts', label: 'Concepts', icon: Brain },
  { id: 'api', label: 'API Reference', icon: Code },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
];

const Docs = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="pt-16">
      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700 mb-4">
            <Terminal size={12} />
            Developer Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-3">
            Build on DeploySarthi
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Everything you need to deploy, monitor, and investigate your infrastructure with AI.
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <nav className="sticky top-24 space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">
              On this page
            </p>
            {NAV_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                  activeSection === s.id
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <s.icon size={14} />
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-16">
          {/* Overview */}
          <section id="overview" className="scroll-mt-24">
            <SectionHeader
              icon={Layers}
              title="Overview"
              subtitle="What DeploySarthi is and who it's for"
            />
            <p className="text-gray-700 leading-relaxed mb-6">
              DeploySarthi is an AI-assisted platform that connects your GitHub repository,
              deploys it to Vercel, monitors it 24/7, detects anomalies, and uses AI to
              explain what went wrong. It replaces the need to juggle five different dashboards
              (GitHub, Vercel, AWS, MongoDB Atlas, AWS Cost Explorer) with one unified workflow.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PillarCard
                icon={GitBranch}
                title="Deploy"
                desc="One-click deploy from GitHub to Vercel"
              />
              <PillarCard
                icon={Activity}
                title="Monitor"
                desc="Real-time metrics every 30 seconds"
              />
              <PillarCard
                icon={Brain}
                title="Investigate"
                desc="AI-powered root cause analysis"
              />
            </div>
          </section>

          {/* Quick Start */}
          <section id="quickstart" className="scroll-mt-24">
            <SectionHeader
              icon={Rocket}
              title="Quick Start"
              subtitle="From zero to deployed in 5 minutes"
            />

            <div className="space-y-6">
              <Step
                number={1}
                title="Create your account"
                desc="Sign up with your email. Verify your account."
              />

              <Step
                number={2}
                title="Connect your GitHub"
                desc="Link your GitHub account in Settings. We'll read your repositories to help you pick the right one."
                code={`Navigate to /settings → Click "Connect GitHub" → Authorize DeploySarthi`}
              />

              <Step
                number={3}
                title="Create a project"
                desc="Pick a GitHub repo, set a category, and choose your deployment target."
                code={`Dashboard → New Project → Step 1 (info) → Step 2 (GitHub) → Step 3 (Vercel)`}
              />

              <Step
                number={4}
                title="Auto-deploy to Vercel"
                desc="Open your project and click 'Auto-deploy'. We'll create the Vercel project and trigger the first build."
                code={`Project → Auto-deploy to Vercel → Watch live URL`}
              />

              <Step
                number={5}
                title="Watch it work"
                desc="Every 30 seconds, we collect metrics, score anomalies, and — if something breaks — create an incident with a full AI investigation."
                isLast
              />
            </div>
          </section>

          {/* Concepts */}
          <section id="concepts" className="scroll-mt-24">
            <SectionHeader
              icon={Brain}
              title="Core Concepts"
              subtitle="How the system works under the hood"
            />

            <div className="space-y-5">
              <ConceptCard
                icon={Cpu}
                title="Anomaly Detection"
                desc="We use Isolation Forest, an unsupervised ML algorithm, to detect when metrics behave abnormally. It learns your baseline automatically — no manual thresholds needed."
                tech="Scikit-learn · Isolation Forest"
              />

              <ConceptCard
                icon={Bell}
                title="Cross-Service Correlation"
                desc="When multiple services fail at once, we build a single timeline showing the causal chain — from the deployment that started it to the metric that crossed its threshold."
                tech="Custom correlator"
              />

              <ConceptCard
                icon={Brain}
                title="AI Investigation"
                desc="Our LLM (Groq's Llama) analyzes the correlated evidence and produces a structured explanation with confidence levels. It separates confirmed facts from suspicions."
                tech="Groq API · Llama 3"
              />

              <ConceptCard
                icon={Cloud}
                title="Guided Investigation"
                desc="Unlike other AI tools that just answer questions, we suggest what to investigate next — based on your actual incident data. Every AI response includes 3 follow-up questions."
                tech="Prompt Generator API"
              />
            </div>
          </section>

          {/* API Reference */}
          <section id="api" className="scroll-mt-24">
            <SectionHeader
              icon={Code}
              title="API Reference"
              subtitle="REST endpoints and authentication"
            />

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Authentication:</strong> All endpoints require an{' '}
                <code className="px-1.5 py-0.5 bg-white rounded text-xs font-mono">
                  Authorization: Bearer &lt;token&gt;
                </code>{' '}
                header unless marked public.
              </p>
            </div>

            <ApiGroup title="Authentication" endpoints={[
              { method: 'POST', path: '/api/auth/register', desc: 'Create a new account' },
              { method: 'POST', path: '/api/auth/login', desc: 'Log in and get JWT' },
              { method: 'GET', path: '/api/auth/me', desc: 'Get current user' },
            ]} />

            <ApiGroup title="Projects" endpoints={[
              { method: 'GET', path: '/api/projects', desc: 'List your projects' },
              { method: 'POST', path: '/api/projects', desc: 'Create a project' },
              { method: 'GET', path: '/api/projects/:id', desc: 'Project detail' },
              { method: 'PATCH', path: '/api/projects/:id/visibility', desc: 'Toggle public/private' },
              { method: 'DELETE', path: '/api/projects/:id', desc: 'Delete project' },
            ]} />

            <ApiGroup title="Incidents" endpoints={[
              { method: 'GET', path: '/api/incidents', desc: 'List all incidents' },
              { method: 'GET', path: '/api/incidents/:id', desc: 'Incident detail' },
              { method: 'PATCH', path: '/api/incidents/:id/acknowledge', desc: 'Acknowledge' },
              { method: 'PATCH', path: '/api/incidents/:id/resolve', desc: 'Resolve' },
            ]} />

            <ApiGroup title="AI" endpoints={[
              { method: 'POST', path: '/api/ai/detect', desc: 'Score a metric snapshot' },
              { method: 'POST', path: '/api/ai/investigate', desc: 'Full incident analysis' },
              { method: 'POST', path: '/api/ai/suggest-prompts', desc: 'Get contextual questions' },
            ]} />

            <ApiGroup title="Vercel" endpoints={[
              { method: 'GET', path: '/api/vercel/projects', desc: 'List Vercel projects' },
              { method: 'POST', path: '/api/vercel/auto-deploy', desc: 'Create + deploy' },
              { method: 'POST', path: '/api/vercel/projects/:id/redeploy', desc: 'Redeploy' },
            ]} />

            <ApiGroup title="Public (no auth)" endpoints={[
              { method: 'GET', path: '/api/public/projects', desc: 'Browse public gallery' },
              { method: 'POST', path: '/api/public/projects/:id/like', desc: 'Toggle like' },
              { method: 'POST', path: '/api/public/projects/:id/comments', desc: 'Add comment' },
            ]} />
          </section>

          {/* Security */}
          <section id="security" className="scroll-mt-24">
            <SectionHeader
              icon={Shield}
              title="Security"
              subtitle="How we protect your data"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SecurityCard
                title="Token Storage"
                points={[
                  'All API keys stored server-side in .env',
                  'GitHub OAuth tokens encrypted per user',
                  'Never committed to version control',
                ]}
              />
              <SecurityCard
                title="Authentication"
                points={[
                  'Passwords hashed with bcrypt (10 rounds)',
                  'JWT tokens expire after 30 days',
                  'Per-request authorization checks',
                ]}
              />
              <SecurityCard
                title="Deployment Safety"
                points={[
                  'No deployment without explicit user approval',
                  'Read-only API scopes by default',
                  'Automatic rollback on failed health check',
                ]}
              />
              <SecurityCard
                title="Data Privacy"
                points={[
                  'Your code never leaves GitHub/Vercel',
                  'We only read metadata (commits, deploy status)',
                  'No telemetry sent to third parties',
                ]}
              />
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-24">
            <SectionHeader
              icon={HelpCircle}
              title="FAQ"
              subtitle="Common questions answered"
            />

            <div className="space-y-3">
              <FAQItem
                q="Is DeploySarthi free?"
                a="Yes, completely. It runs on free-tier services: Vercel (hosting), MongoDB Atlas (database), Groq (LLM), and GitHub (source). The only potential cost is AWS App Runner, which stays under $5/month for typical low-traffic APIs."
              />
              <FAQItem
                q="Which deployment targets are supported?"
                a="Vercel for frontends and full-stack apps. AWS App Runner for backend services (planned). You pick one target per project."
              />
              <FAQItem
                q="How accurate is the AI?"
                a="We achieved 100% detection on our 6 synthetic fault scenarios and a 2.98% false positive rate. Every AI response includes a confidence level — high, medium, or low — based on the strength of the evidence."
              />
              <FAQItem
                q="Can I use it with private repos?"
                a="Yes, as long as your connected GitHub account has access to the repo. We store the OAuth token securely and never share it."
              />
              <FAQItem
                q="What happens when Groq rate-limits?"
                a="We cache responses for 60 seconds and fall back to a rule-based explanation if the API is unavailable. The system never stops working."
              />
              <FAQItem
                q="How do I report a bug or request a feature?"
                a="Open an issue on our GitHub repository. We review every request."
              />
            </div>

            {/* CTA */}
            <div className="mt-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">
                Ready to ship with confidence?
              </h3>
              <p className="text-indigo-100 mb-6">
                Connect your GitHub. Deploy to Vercel. Let AI handle the rest.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700
                  rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
              >
                Get Started Free
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// ============ Sub-components ============

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-2">
      <Icon size={18} className="text-indigo-600" />
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
    </div>
    {subtitle && <p className="text-gray-500">{subtitle}</p>}
  </div>
);

const PillarCard = ({ icon: Icon, title, desc }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
      <Icon size={18} className="text-indigo-600" />
    </div>
    <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-600">{desc}</p>
  </div>
);

const Step = ({ number, title, desc, code, isLast }) => (
  <div className="relative flex gap-4">
    {/* Timeline */}
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      {!isLast && <div className="w-px flex-1 bg-gray-200 my-2" />}
    </div>

    {/* Content */}
    <div className="pb-8 flex-1">
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-3">{desc}</p>
      {code && (
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">
          {code}
        </pre>
      )}
    </div>
  </div>
);

const ConceptCard = ({ icon: Icon, title, desc, tech }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-indigo-600" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-semibold text-gray-600">
            {tech}
          </span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  </div>
);

const ApiGroup = ({ title, endpoints }) => (
  <div className="mb-6">
    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">{title}</h3>
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {endpoints.map((e, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-3 ${
            i !== endpoints.length - 1 ? 'border-b border-gray-100' : ''
          }`}
        >
          <span
            className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              e.method === 'GET' ? 'bg-blue-50 text-blue-700' :
              e.method === 'POST' ? 'bg-emerald-50 text-emerald-700' :
              e.method === 'PATCH' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            }`}
          >
            {e.method}
          </span>
          <code className="text-xs font-mono text-gray-900 flex-shrink-0">{e.path}</code>
          <span className="text-xs text-gray-500 ml-auto hidden md:block">{e.desc}</span>
        </div>
      ))}
    </div>
  </div>
);

const SecurityCard = ({ title, points }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <h3 className="font-bold text-gray-900 mb-3">{title}</h3>
    <ul className="space-y-2">
      {points.map((p, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
          <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>{p}</span>
        </li>
      ))}
    </ul>
  </div>
);

const FAQItem = ({ q, a }) => (
  <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
    <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors list-none">
      <span className="font-semibold text-gray-900">{q}</span>
      <ArrowRight
        size={16}
        className="text-gray-400 flex-shrink-0 transition-transform group-open:rotate-90"
      />
    </summary>
    <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
      {a}
    </div>
  </details>
);

export default Docs;