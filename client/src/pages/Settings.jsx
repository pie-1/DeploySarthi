import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa';
import { CheckCircle2, AlertCircle, LinkIcon, Unlink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Settings = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/github/status');
      setStatus(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const github = searchParams.get('github');
    if (github === 'success') {
      setBanner({ type: 'success', text: 'GitHub connected successfully!' });
      setSearchParams({}, { replace: true });
    } else if (github === 'error') {
      setBanner({ type: 'error', text: 'Failed to connect GitHub. Please try again.' });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = () => {
    if (!user?._id) {
      alert('Please log in again');
      return;
    }
    // Redirect to OAuth start with userId
    const url = `${API_BASE}/github/oauth/start?userId=${user._id}`;
    console.log('Redirecting to:', url);
    window.location.href = url;
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect GitHub? You will lose access to your repos.')) return;
    try {
      await api.post('/github/disconnect');
      setBanner({ type: 'success', text: 'GitHub disconnected' });
      fetchStatus();
    } catch (err) {
      setBanner({ type: 'error', text: 'Failed to disconnect' });
    }
  };

  return (
    <div className="pb-16 px-6">
      <div className="max-w-3xl mx-auto pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-600 mt-1.5">
            Manage your account and connected services
          </p>
        </div>

        {banner && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
              banner.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {banner.type === 'success' ? (
              <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium">{banner.text}</p>
          </div>
        )}

        {/* GitHub Integration Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                <FaGithub size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">GitHub Integration</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Connect your GitHub account to link repositories
                </p>
              </div>
            </div>
            {!loading && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  status?.mode === 'oauth'
                    ? 'bg-emerald-50 text-emerald-700'
                    : status?.mode === 'pat'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {status?.connected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {status?.mode === 'oauth'
                  ? 'Connected'
                  : status?.mode === 'pat'
                  ? 'Using server token'
                  : 'Not connected'}
              </span>
            )}
          </div>

          {status?.mode === 'oauth' && (
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
                <p className="text-xs text-emerald-700">Connected via OAuth</p>
              </div>
            </div>
          )}

          {status?.mode === 'pat' && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
              <p className="text-xs text-amber-800">
                Currently using a server-configured token. Connect your own GitHub account
                for per-user isolation.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {status?.mode !== 'oauth' ? (
              <button
                onClick={handleConnect}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white
                  rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                <LinkIcon size={14} />
                Connect GitHub
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white
                  rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                <Unlink size={14} />
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;