import { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { vercelService } from '../../services/vercelService';

const STATE_STYLES = {
  READY: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Ready' },
  ERROR: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Error' },
  BUILDING: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Building' },
  QUEUED: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Queued' },
  CANCELED: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Canceled' },
};

const VercelDeployments = ({ vercelProjectId }) => {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!vercelProjectId) return;
    (async () => {
      try {
        const res = await vercelService.listDeployments(vercelProjectId, 15);
        setDeployments(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load deployments');
      } finally {
        setLoading(false);
      }
    })();
  }, [vercelProjectId]);

  if (!vercelProjectId) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Vercel Deployments</h3>
        <p className="text-sm text-gray-500">
          No Vercel project linked. Connect Vercel when creating a project.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Vercel Deployments</h3>
        <a
          href={`https://vercel.com/dashboard`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1"
        >
          Open Vercel <ExternalLink size={11} />
        </a>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : deployments.length === 0 ? (
        <p className="text-sm text-gray-500">No deployments yet.</p>
      ) : (
        <div className="space-y-1">
          {deployments.map((d) => {
            const style = STATE_STYLES[d.state] || STATE_STYLES.QUEUED;
            const Icon = style.icon;
            return (
              <a
                key={d.id}
                href={`https://${d.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} className={style.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                      {d.target || 'preview'}
                    </span>
                    <span className="font-mono text-xs text-gray-500 truncate">
                      {d.commit?.shortSha || d.id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-1 mt-0.5">
                    {d.commit?.message || d.name}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-semibold ${style.color}`}>{style.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {new Date(d.createdAt).toLocaleString()}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VercelDeployments;