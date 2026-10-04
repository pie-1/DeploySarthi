import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa';
import { CheckCircle2, AlertCircle, ExternalLink, Settings } from 'lucide-react';
import api from '../../services/api';

const GitHubConnectionCard = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/github/status');
        setStatus(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 animate-pulse">
        <div className="h-16" />
      </div>
    );
  }

  const isConnected = status?.connected;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 mb-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <FaGithub size={22} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">GitHub Integration</h3>
            <p className="text-xs text-gray-300 mt-0.5">
              {isConnected
                ? `Connected via ${status.mode === 'pat' ? 'server token' : 'OAuth'}`
                : 'Connect to link your repositories'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 size={12} />
                Active
              </span>
              <Link
                to="/settings"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10
                  hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                <Settings size={12} />
                Manage
              </Link>
            </>
          ) : (
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-gray-900
                hover:bg-gray-100 text-xs font-semibold transition-colors"
            >
              Connect GitHub
              <ExternalLink size={12} />
            </Link>
          )}
        </div>
      </div>

      {isConnected && status.login && (
        <div className="mt-4 flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
          {status.avatar && (
            <img
              src={status.avatar}
              alt={status.login}
              className="w-7 h-7 rounded-full border border-white/20"
            />
          )}
          <div className="flex-1">
            <p className="text-xs font-medium text-white">@{status.login}</p>
          </div>
          <Link
            to="/projects"
            className="text-xs text-gray-300 hover:text-white transition-colors"
          >
            View repos →
          </Link>
        </div>
      )}
    </div>
  );
};

export default GitHubConnectionCard;