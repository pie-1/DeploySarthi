import { useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, Loader2, ExternalLink,
  GitBranch, Rocket, ChevronRight,
} from 'lucide-react';
import api from '../../services/api';

const STATE_STYLES = {
  READY: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Ready' },
  ERROR: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Error' },
  BUILDING: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Building' },
  INITIALIZING: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Initializing' },
  QUEUED: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Queued' },
  CANCELED: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Canceled' },
};

const DeploymentCard = ({ deployment, projectName, onRedeployed }) => {
  const [redeploying, setRedeploying] = useState(false);

  const style = STATE_STYLES[deployment.state] || STATE_STYLES.QUEUED;
  const Icon = style.icon;
  const isAnimating = deployment.state === 'BUILDING' || deployment.state === 'INITIALIZING';

  const handleRedeploy = async () => {
    setRedeploying(true);
    try {
      await api.post(`/vercel/projects/${deployment.projectId}/redeploy`);
      if (onRedeployed) onRedeployed();
    } catch (err) {
      alert('Failed to trigger redeploy');
    } finally {
      setRedeploying(false);
    }
  };

  const deployUrl = deployment.url ? `https://${deployment.url}` : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={`${style.color} ${isAnimating ? 'animate-spin' : ''}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">
                {projectName || deployment.name}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                {deployment.target || 'preview'}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${style.bg} ${style.color}`}>
                {style.label}
              </span>
            </div>
          </div>

          {/* Commit message */}
          <p className="text-sm text-gray-700 mt-1 line-clamp-1">
            {deployment.commit?.message || 'No commit message'}
          </p>

          {/* Meta */}
          <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-gray-500">
            {deployment.commit?.shortSha && (
              <span className="flex items-center gap-1 font-mono">
                <GitBranch size={11} />
                {deployment.commit.shortSha}
              </span>
            )}
            {deployment.commit?.author && <span>{deployment.commit.author}</span>}
            <span>{new Date(deployment.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              title="Open deployment"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={handleRedeploy}
            disabled={redeploying}
            className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors
              disabled:opacity-50"
            title="Redeploy"
          >
            {redeploying ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Rocket size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeploymentCard;