import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, Clock, CheckCircle2,
  Activity, Server, GitBranch, DollarSign,
} from 'lucide-react';
import { incidentService } from '../services/projectService';
import AIAnalysisPanel from '../components/incidents/AIAnalysisPanel';
import Timeline from '../components/incidents/Timeline';

const SEVERITY_STYLES = {
  critical: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Critical' },
  warning: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Warning' },
  info: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Info' },
};

const IncidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchIncident = async () => {
    setLoading(true);
    try {
      const res = await incidentService.getById(id);
      setIncident(res.data);
    } catch (err) {
      setError('Incident not found');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const handleAcknowledge = async () => {
    setActionLoading(true);
    try {
      const res = await incidentService.acknowledge(id);
      setIncident(res.data);
    } catch (err) {
      alert('Failed to acknowledge');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    const notes = prompt('Resolution notes (optional):');
    if (notes === null) return;
    setActionLoading(true);
    try {
      const res = await incidentService.resolve(id, notes);
      setIncident(res.data);
    } catch (err) {
      alert('Failed to resolve');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pb-16 px-6">
        <div className="max-w-5xl mx-auto pt-8">
          <div className="space-y-4">
            <div className="h-8 w-40 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-32 bg-white border border-gray-200 rounded-2xl animate-pulse" />
            <div className="h-64 bg-white border border-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="pb-16 px-6">
        <div className="max-w-5xl mx-auto pt-8">
          <Link to="/incidents" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft size={16} />
            Back to Incidents
          </Link>
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <AlertTriangle size={40} className="text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Incident not found</h2>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const sev = SEVERITY_STYLES[incident.severity] || SEVERITY_STYLES.warning;

  const duration = incident.duration
    ? Math.floor(incident.duration / 1000 / 60)
    : Math.floor((Date.now() - new Date(incident.startedAt).getTime()) / 1000 / 60);

  return (
    <div className="pb-16 px-6">
      <div className="max-w-5xl mx-auto pt-8">
        {/* Back link */}
        <button
          onClick={() => navigate('/incidents')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={16} />
          Back to Incidents
        </button>

        {/* Header card */}
        <div className={`bg-white border ${sev.border} rounded-2xl p-6 mb-6`}>
          <div className="flex items-start justify-between gap-6 mb-5">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${sev.bg} flex items-center justify-center flex-shrink-0`}>
                <AlertTriangle size={22} className={sev.text} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${sev.bg} ${sev.text}`}>
                    {sev.label}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                    {incident.status}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {incident.project?.name || 'Project'} · Started {new Date(incident.startedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            {incident.status === 'open' && (
              <button
                onClick={handleAcknowledge}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold bg-amber-100 text-amber-800 rounded-lg
                  hover:bg-amber-200 transition-colors disabled:opacity-60"
              >
                Acknowledge
              </button>
            )}
            {incident.status !== 'resolved' && (
              <button
                onClick={handleResolve}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg
                  hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                Resolve
              </button>
            )}
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                <Clock size={12} /> Duration
              </p>
              <p className="text-sm font-semibold text-gray-900">{duration} min</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                <Activity size={12} /> Symptoms
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {incident.symptoms?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                <Server size={12} /> Services
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {incident.timeline?.length || 0} events
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                <DollarSign size={12} /> Cost Impact
              </p>
              <p className="text-sm font-semibold text-gray-900">
                ${incident.costImpact?.estimated?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="mb-6">
          <AIAnalysisPanel analysis={incident.aiAnalysis} />
        </div>

        {/* Symptoms */}
        {incident.symptoms?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Detected Symptoms</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                    <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Metric</th>
                    <th className="text-right pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Value</th>
                    <th className="text-right pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Baseline</th>
                    <th className="text-right pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {incident.symptoms.map((s, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 font-medium text-gray-900">{s.service}</td>
                      <td className="py-3 text-gray-700 font-mono text-xs">{s.metric}</td>
                      <td className="py-3 text-right font-mono text-gray-900">{s.value}</td>
                      <td className="py-3 text-right font-mono text-gray-500">{s.baseline}</td>
                      <td className={`py-3 text-right font-mono font-semibold ${
                        s.changePercent > 100 ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {s.changePercent > 0 ? '+' : ''}{s.changePercent?.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="mb-6">
          <Timeline events={incident.timeline || []} />
        </div>

        {/* Related Deployment */}
        {incident.relatedDeployment?.commitId && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Related Deployment</h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                <GitBranch size={18} className="text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-mono font-semibold text-gray-900">
                  {incident.relatedDeployment.commitId}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Branch: {incident.relatedDeployment.branch || 'main'}
                </p>
                {incident.relatedDeployment.filesChanged?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {incident.relatedDeployment.filesChanged.map((f, i) => (
                      <span key={i} className="text-[11px] font-mono px-2 py-1 bg-gray-100 rounded text-gray-700">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentDetail;