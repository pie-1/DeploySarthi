import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Clock, Loader2, ExternalLink,
  GitBranch, Rocket, MessageSquare, MoreVertical, EyeOff, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [working, setWorking] = useState(false);

  const style = STATE_STYLES[deployment.state] || STATE_STYLES.QUEUED;
  const Icon = style.icon;
  const isAnimating = deployment.state === 'BUILDING' || deployment.state === 'INITIALIZING';
  const isFailed = deployment.state === 'ERROR' || deployment.state === 'CANCELED';

  const handleRedeploy = async () => {
    setRedeploying(true);
    try {
      await api.post(`/vercel/projects/${deployment.projectId}/redeploy`);
      toast.success('Redeploy triggered');
      if (onRedeployed) onRedeployed();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger redeploy');
    } finally {
      setRedeploying(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Stop monitoring this project?\n\nThe Vercel deployment stays live, but DeploySarthi stops tracking it.')) return;
    setWorking(true);
    try {
      await api.post(`/vercel/projects/${deployment.projectId}/unlink`);
      toast.success('Monitoring stopped');
      if (onRedeployed) onRedeployed();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unlink');
    } finally {
      setWorking(false);
      setMenuOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete Vercel project "${projectName}"?\n\nThis permanently removes the Vercel project and ALL its deployments. Cannot be undone.`)) return;
    setWorking(true);
    try {
      await api.delete(`/vercel/projects/${deployment.projectId}`);
      toast.success('Vercel project deleted');
      if (onRedeployed) onRedeployed();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setWorking(false);
      setMenuOpen(false);
    }
  };

  const deployUrl = deployment.url ? `https://${deployment.url}` : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={`${style.color} ${isAnimating ? 'animate-spin' : ''}`} />
        </div>

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

          <p className="text-sm text-gray-700 mt-1 line-clamp-1">
            {deployment.commit?.message || 'No commit message'}
          </p>

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

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to={`/ai?deploymentId=${deployment.id}&projectId=${deployment.projectId}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isFailed
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
            title={isFailed ? 'Debug this failure with AI' : 'Ask AI about this deployment'}
          >
            <MessageSquare size={12} />
            {isFailed ? 'Debug failure' : 'Ask AI'}
          </Link>

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
            className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors disabled:opacity-50"
            title="Redeploy"
          >
            {redeploying ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Rocket size={14} />
            )}
          </button>

          {/* 3-dot menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              disabled={working}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
              title="More options"
            >
              {working ? <Loader2 size={14} className="animate-spin" /> : <MoreVertical size={14} />}
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px]">
                  <button
                    onClick={handleUnlink}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <EyeOff size={12} />
                    Stop monitoring
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 size={12} />
                    Delete Vercel project
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentCard;