import { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { aiService } from '../services/aiService';
import { incidentService } from '../services/projectService';
import SuggestedPrompts from '../components/ai/SuggestedPrompts';
import ChatMessage from '../components/ai/ChatMessage';
import ChatInput from '../components/ai/ChatInput';

const AIInvestigation = () => {
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const hasLoadedRef = useRef(false);

  const loadSuggestions = async (allIncidents) => {
    setLoadingSuggestions(true);
    try {
      const res = await aiService.suggestPrompts({
        incidents: allIncidents.slice(0, 5),
        projects: [],
        recentDeployments: [],
        userQuestion: '',
      });
      setSuggestions(res.data?.suggestions || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchContext = async () => {
    try {
      const res = await incidentService.getAll();
      const allIncidents = res.data || [];
      setIncidents(allIncidents);

      const firstOpen =
        allIncidents.find((i) => i.status === 'open') || allIncidents[0];
      if (firstOpen) {
        setSelectedIncident(firstOpen);
        await loadSuggestions(allIncidents);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
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
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await aiService.chat({
        title: selectedIncident.title,
        severity: selectedIncident.severity,
        startedAt: selectedIncident.startedAt,
        symptoms: selectedIncident.symptoms || [],
        timeline: selectedIncident.timeline || [],
        relatedDeployment: selectedIncident.relatedDeployment || {},
        userQuestion: question,
      });

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

  const handleIncidentSelect = (incident) => {
    setSelectedIncident(incident);
    setMessages([]);
  };

  const handleRefresh = async () => {
    hasLoadedRef.current = false;
    await fetchContext();
  };

  return (
    <div className="pb-16 px-6">
      <div className="max-w-7xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              AI Investigation
            </h1>
            <p className="text-sm text-gray-600 mt-1.5">
              Guided investigation — ask anything, or follow the suggested prompts
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
          {/* Left panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Incidents */}
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

            {/* Suggestions */}
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
          </div>

          {/* Chat panel */}
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