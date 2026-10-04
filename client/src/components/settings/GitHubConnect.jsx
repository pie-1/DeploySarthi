import { FaGithub } from 'react-icons/fa';
import { CheckCircle2, AlertCircle, Link as LinkIcon, Unlink } from 'lucide-react';

const GitHubConnect = ({ status, onConnect, onDisconnect }) => {
  const isConnected = status?.connected;
  const mode = status?.mode || 'none';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
            <FaGithub size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">GitHub Integration</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Connect your GitHub account to link repos and read commits
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isConnected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {isConnected ? 'Connected' : 'Not connected'}
        </span>
      </div>

      {isConnected && mode === 'oauth' && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
          {status.avatar && (
            <img
              src={status.avatar}
              alt={status.login}
              className="w-9 h-9 rounded-full border border-emerald-200"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-900">@{status.login}</p>
            <p className="text-xs text-emerald-700">
              Connected via OAuth{' '}
              {status.connectedAt
                ? `· ${new Date(status.connectedAt).toLocaleDateString()}`
                : ''}
            </p>
          </div>
        </div>
      )}

      {isConnected && mode === 'pat' && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
          <p className="text-xs text-amber-800">
            <strong>Currently using a server-configured token.</strong> Connect your own
            GitHub account for full per-user isolation.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {!isConnected ? (
          <button
            onClick={onConnect}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white
              rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            <LinkIcon size={14} />
            Connect GitHub
          </button>
        ) : (
          <>
            <button
              onClick={onConnect}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-gray-800
                border border-gray-200 rounded-lg text-sm font-semibold
                hover:bg-gray-50 transition-colors"
            >
              <LinkIcon size={14} />
              Reconnect
            </button>
            <button
              onClick={onDisconnect}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white
                rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              <Unlink size={14} />
              Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GitHubConnect;