import { useState, useEffect } from 'react';
import {
  CheckCircle2, AlertCircle, XCircle, Loader2,
  RefreshCw, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const SEVERITY_STYLES = {
  pass: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Pass' },
  warning: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Warning' },
  critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Critical' },
  skip: { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Skipped' },
};

const ReadinessPanel = ({ projectId, hasGithub }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    try {
      const res = await api.get(`/readiness/${projectId}`);
      setReport(res.data.data);
    } catch (err) {
      // Silently ignore — no report yet
    }
  };

useEffect(() => {
  if (!hasGithub) return;

  (async () => {
    try {
      const res = await api.get(`/readiness/${projectId}`);
      const existing = res.data.data;

      if (existing && existing.score != null) {
        setReport(existing);
      } else {
        // No report yet — auto-run
        console.log('[readiness] Auto-running first check');
        await autoRunCheck();
      }
    } catch (err) {
      // Silent — no report yet
      await autoRunCheck();
    }
  })();
}, [projectId, hasGithub]);

const autoRunCheck = async () => {
  setLoading(true);
  setError('');
  try {
    const res = await api.post(`/readiness/${projectId}/check`);
    setReport(res.data.data);
  } catch (err) {
    console.error('[readiness] Auto-check failed:', err.message);
    setError(err.response?.data?.message || 'Readiness check failed');
  } finally {
    setLoading(false);
  }
};

  const runCheck = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/readiness/${projectId}/check`);
      setReport(res.data.data);
      toast.success('Readiness check complete');
    } catch (err) {
      const msg = err.response?.data?.message || 'Readiness check failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!hasGithub) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-2">Readiness Check</h3>
        <p className="text-sm text-gray-500">
          Link a GitHub repository to run deployment readiness checks.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Deployment Readiness
          </h3>
        </div>
        <button
          onClick={runCheck}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold
            bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {report ? 'Re-run' : 'Run check'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      {/* No report yet */}
      {!report && !loading && (
        <div className="text-center py-8">
          <ShieldCheck size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-1">No readiness report yet</p>
          <p className="text-xs text-gray-500">
            Run the check to identify deployment issues before they happen.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && !report && (
        <div className="text-center py-8">
          <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Analyzing repository...</p>
        </div>
      )}

      {/* Report */}
      {report && (
        <>
          {/* Score */}
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              report.score >= 80 ? 'bg-emerald-50' :
              report.score >= 50 ? 'bg-amber-50' : 'bg-red-50'
            }`}>
              <span className={`text-2xl font-bold ${
                report.score >= 80 ? 'text-emerald-600' :
                report.score >= 50 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {report.score}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Readiness Score</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {report.summary.passed} passed · {report.summary.warnings} warnings · {report.summary.critical} critical
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Framework: <span className="font-mono">{report.framework}</span>
                {' · '}
                Checked {new Date(report.checkedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Findings */}
          <div className="space-y-2">
            {report.findings.map((f, i) => {
              const s = SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.skip;
              const Icon = s.icon;
              return (
                <div key={i} className={`p-3 rounded-lg border ${
                  f.severity === 'critical' ? 'border-red-100 bg-red-50/50' :
                  f.severity === 'warning' ? 'border-amber-100 bg-amber-50/50' :
                  f.severity === 'pass' ? 'border-emerald-100 bg-emerald-50/50' :
                  'border-gray-100 bg-gray-50/50'
                }`}>
                  <div className="flex items-start gap-2">
                    <Icon size={14} className={`${s.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${s.bg} ${s.color}`}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{f.detail}</p>
                      {f.remediation && (
                        <p className="text-xs text-indigo-700 mt-1">
                          <span className="font-semibold">Fix:</span> {f.remediation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ReadinessPanel;