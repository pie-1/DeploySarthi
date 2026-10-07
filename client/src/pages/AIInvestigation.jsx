import { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { incidentService } from '../services/projectService';
import api from '../services/api';
import SuggestedPrompts from '../components/ai/SuggestedPrompts';
import ChatMessage from '../components/ai/ChatMessage';
import ChatInput from '../components/ai/ChatInput';

// ─────────────────────────────────────────────────────────────
// Sanitize any incident-shaped payload before sending to Python.
// ─────────────────────────────────────────────────────────────
function sanitizeIncident(obj) {
  if (!obj || typeof obj !== 'object') return {};
  return {
    incidentId: typeof obj.incidentId === 'string' ? obj.incidentId : '',
    title: typeof obj.title === 'string' ? obj.title : '',
    severity: typeof obj.severity === 'string' ? obj.severity : 'warning',
    startedAt: typeof obj.startedAt === 'string' ? obj.startedAt : '',
    symptoms: Array.isArray(obj.symptoms) ? obj.symptoms.filter(Boolean) : [],
    timeline: Array.isArray(obj.timeline) ? obj.timeline.filter(Boolean) : [],
    relatedDeployment:
      obj.relatedDeployment && typeof obj.relatedDeployment === 'object'
        ? obj.relatedDeployment
        : {},
    context:
      obj.context && typeof obj.context === 'object' ? obj.context : {},
    userQuestion: typeof obj.userQuestion === 'string' ? obj.userQuestion : '',
    conversationHistory: Array.isArray(obj.conversationHistory)
      ? obj.conversationHistory.filter(Boolean)
      : [],
  };
}

const AIInvestigation = () => {
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const preloadIncidentId = searchParams.get('incidentId');
  const preloadDeploymentId = searchParams.get('deploymentId');
  const preloadProjectId = searchParams.get('projectId');
  const messagesEndRef = useRef(null);
  const initRef = useRef(false);

  const loadSuggestions = async (allIncidents) => {
    setLoadingSuggestions(true);
    try {
      const cacheKey = `suggestions_${(allIncidents || [])
        .slice(0, 3)
        .map((i) => i._id || i.title)
        .join('_')}`;

      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          setSuggestions(JSON.parse(cached));
          setLoadingSuggestions(false);
          return;
        } catch {}
      }

      const res = await aiService.suggestPrompts({
        incidents: (allIncidents || []).slice(0, 5),
        projects: [],
        recentDeployments: [],
        userQuestion: '',
      });

      let newSuggestions = res.data?.suggestions || [];

      // Fallback: generate client-side suggestions if AI returned none
      if (newSuggestions.length === 0 && allIncidents.length > 0) {
        const first = allIncidents[0];
        newSuggestions = [
          {
            question: `What caused "${first.title}"?`,
            reason: 'Start with the most recent incident',
            type: 'incident_analysis',
            priority: 'high',
          },
          {
            question: 'Which metrics changed together during this incident?',
            reason: 'Correlated metrics reveal cascade failures',
            type: 'metric_comparison',
            priority: 'medium',
          },
          {
            question: 'Did a recent deployment correlate with this incident?',
            reason: 'Most incidents trace back to a code change',
            type: 'deployment_correlation',
            priority: 'medium',
          },
        ];
      }

      setSuggestions(newSuggestions);

      if (newSuggestions.length > 0) {
        sessionStorage.setItem(cacheKey, JSON.stringify(newSuggestions));
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Send a question in deployment mode
  // ─────────────────────────────────────────────────────────────
  const sendDeploymentQuestion = async (incident, question) => {
    const userMsg = { role: 'user', content: question };
    setMessages([userMsg]);
    setLoading(true);

    try {
      const payload = sanitizeIncident({
        title: incident.title,
        severity: incident.severity,
        startedAt: incident.startedAt,
        symptoms: incident.symptoms,
        timeline: incident.timeline,
        userQuestion: question,
        conversationHistory: [],
        context: incident.deploymentContext || {},
      });

      const res = await aiService.chat(payload);
      const analysis = res.data?.analysis || {};
      setMessages([
        userMsg,
        { role: 'assistant', content: analysis.summary || '', analysis },
      ]);
    } catch (err) {
      console.error('[ai] deployment debug failed:', err);
      setMessages([
        userMsg,
        {
          role: 'assistant',
          content: err.response?.data?.message || 'Could not analyze this deployment.',
          analysis: { summary: 'Investigation failed. Please try again.' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Send a question in incident mode (used for preload auto-ask)
  // ─────────────────────────────────────────────────────────────
  const handleSendForIncident = async (incident, question) => {
    const userMsg = { role: 'user', content: question };
    setMessages([userMsg]);
    setLoading(true);

    try {
      const payload = sanitizeIncident({
        incidentId: incident._id,
        projectId:
          typeof incident.project === 'object'
            ? incident.project?._id
            : incident.project,
        title: incident.title,
        severity: incident.severity,
        startedAt: incident.startedAt,
        symptoms: incident.symptoms || [],
        timeline: incident.timeline || [],
        relatedDeployment: incident.relatedDeployment || {},
        userQuestion: question,
        conversationHistory: [],
      });

      const res = await aiService.chat(payload);
      const analysis = res.data?.analysis || {};
      setMessages([
        userMsg,
        { role: 'assistant', content: analysis.summary || '', analysis },
      ]);
    } catch (err) {
      console.error('[ai] incident preload failed:', err);
      setMessages([
        userMsg,
        {
          role: 'assistant',
          content: err.response?.data?.message || 'Could not analyze this incident.',
          analysis: { summary: 'Investigation failed. Please try again.' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Preload deployment context (from /deploy → Debug failure)
  // ─────────────────────────────────────────────────────────────
  const preloadDeployment = async () => {
    try {
      const res = await api.get(`/vercel/deployments/${preloadDeploymentId}`);
      const deployment = res.data.data;
      if (!deployment) {
        setError('Deployment not found');
        return;
      }

      const isFailed = deployment.state === 'ERROR' || deployment.state === 'CANCELED';

      const commit = deployment.commit || null;
      const sanitizedCommit =
        commit && commit.shortSha
          ? {
              sha: commit.shortSha || '',
              message: commit.message || '(no message)',
              author: commit.author || 'unknown',
              date: deployment.createdAt || new Date().toISOString(),
            }
          : null;

      const syntheticIncident = {
        _id: `deployment-${preloadDeploymentId}`,
        isDeployment: true,
        deploymentId: preloadDeploymentId,
        title: `${deployment.name || 'Deployment'} — ${deployment.state}`,
        severity: isFailed ? 'critical' : 'info',
        status: 'open',
        startedAt: deployment.createdAt || new Date().toISOString(),
        symptoms: [
          {
            service: 'vercel',
            metric: 'deployment_state',
            value: deployment.state || 'UNKNOWN',
            baseline: 'READY',
            changePercent: isFailed ? 100 : 0,
          },
        ],
        timeline: [
          {
            timestamp: deployment.createdAt || new Date().toISOString(),
            service: 'vercel',
            event: `Deployment ${deployment.state} · commit ${commit?.shortSha || 'unknown'}`,
          },
        ],
        deploymentContext: {
          project: {
            name: deployment.name || 'project',
            environment: deployment.target || 'preview',
            deploymentTarget: 'vercel',
          },
          recentDeployments: [
            {
              state: deployment.state || 'UNKNOWN',
              target: deployment.target || 'production',
              createdAt: deployment.createdAt || new Date().toISOString(),
              commitSha: commit?.shortSha || '',
              commitMessage: commit?.message || '',
              commitAuthor: commit?.author || '',
            },
          ],
          recentCommits: sanitizedCommit ? [sanitizedCommit] : [],
        },
      };

      setSelectedIncident(syntheticIncident);

      const autoQuestion = isFailed
        ? 'Why did this deployment fail? What should I fix?'
        : 'Is this deployment healthy? Anything to watch out for?';

      await sendDeploymentQuestion(syntheticIncident, autoQuestion);
    } catch (err) {
      console.error('[ai] preload deployment error:', err);
      setError('Could not load deployment info');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Fetch initial context based on URL params
  // ─────────────────────────────────────────────────────────────
  const fetchContext = async () => {
    try {
      // Priority 1: Deployment preload
      if (preloadDeploymentId) {
        await preloadDeployment();
        return;
      }

      const res = await incidentService.getAll();
      const allIncidents = res.data || [];
      setIncidents(allIncidents);

      // Priority 2: Incident preload — auto-ask
      if (preloadIncidentId) {
        const target = allIncidents.find((i) => i._id === preloadIncidentId);
        if (target) {
          setSelectedIncident(target);
          await loadSuggestions([target]);

          const autoQuestion = `Analyze this incident: "${target.title}". What likely caused it, and what should I check next?`;

          setTimeout(() => {
            handleSendForIncident(target, autoQuestion);
          }, 300);
          return;
        }
      }

      // Fallback: first open incident
      const firstOpen = allIncidents.find((i) => i.status === 'open') || allIncidents[0];
      if (firstOpen) {
        setSelectedIncident(firstOpen);
        await loadSuggestions(allIncidents);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    fetchContext();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (question) => {
    if (!selectedIncident) {
      setError('Select an incident first');
      return;
    }

    setError('');
    const userMessage = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content || m.analysis?.summary || '',
      }));

      const payload = sanitizeIncident({
        incidentId: selectedIncident.isDeployment ? undefined : selectedIncident._id,
        projectId:
          preloadProjectId ||
          (typeof selectedIncident.project === 'object'
            ? selectedIncident.project?._id
            : selectedIncident.project),
        title: selectedIncident.title,
        severity: selectedIncident.severity,
        startedAt: selectedIncident.startedAt,
        symptoms: selectedIncident.symptoms || [],
        timeline: selectedIncident.timeline || [],
        relatedDeployment: selectedIncident.relatedDeployment || {},
        userQuestion: question,
        conversationHistory: history,
        context: selectedIncident.isDeployment
          ? selectedIncident.deploymentContext || {}
          : undefined,
      });

      const res = await aiService.chat(payload);
      const analysis = res.data?.analysis || {};
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: analysis.summary || '', analysis },
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'AI investigation failed');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I could not analyze that. Please try again.',
          analysis: { summary: 'Investigation failed. Please try again.' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleIncidentSelect = async (incident) => {
    setSelectedIncident(incident);
    setMessages([]);
    await loadSuggestions([incident]);
  };

  const handleRefresh = async () => {
    initRef.current = false;
    await fetchContext();
  };

  const isDeploymentMode = !!selectedIncident?.isDeployment;

  return (
    <div className="pb-16 px-6">
      <div className="max-w-7xl mx-auto pt-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              AI Investigation
            </h1>
            <p className="text-sm text-gray-600 mt-1.5">
              {isDeploymentMode
                ? 'Debugging a deployment — ask anything or follow up'
                : 'Guided investigation — ask anything, or follow the suggested prompts'}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Refresh context"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Active Incidents
              </h2>
              {incidents.length === 0 ? (
                <p className="text-sm text-gray-500">No incidents found.</p>
              ) : (
                <div className="space-y-2">
                  {incidents.slice(0, 5).map((inc) => (
                    <button
                      key={inc._id}
                      onClick={() => handleIncidentSelect(inc)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedIncident?._id === inc._id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-1">
                        {inc.severity}
                      </p>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {inc.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(inc.startedAt).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isDeploymentMode && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-indigo-600" />
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Suggested Investigations
                  </h2>
                </div>
                <SuggestedPrompts
                  suggestions={suggestions}
                  onSelect={handleSend}
                  loading={loadingSuggestions}
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl flex flex-col h-[calc(100vh-12rem)]">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles size={22} className="text-indigo-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      Start your investigation
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                      {selectedIncident
                        ? 'Ask a question or click a suggestion on the left'
                        : 'Select an incident to begin'}
                    </p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <ChatMessage key={i} message={msg} onFollowUp={handleSend} />
                  ))
                )}

                {loading && (
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                      <Sparkles size={14} className="text-white animate-pulse" />
                    </div>
                    <span>DeploySarthi is analyzing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-100 p-4">
                <ChatInput
                  onSend={handleSend}
                  loading={loading}
                  disabled={!selectedIncident}
                />
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  AI may make mistakes. Always verify with your own investigation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInvestigation;