import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa';
import { CheckCircle2, AlertCircle, LinkIcon, Unlink, Mail, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Settings = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [githubStatus, setGithubStatus] = useState(null);
  const [vercelStatus, setVercelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const github = searchParams.get('github');
    if (github === 'success') {
      setBanner({ type: 'success', text: 'GitHub connected successfully' });
      setSearchParams({}, { replace: true });
    } else if (github === 'error') {
      setBanner({ type: 'error', text: 'Failed to connect GitHub' });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchStatuses = async () => {
    try {
      const [ghRes, vcRes] = await Promise.all([
        api.get('/github/status'),
        api.get('/vercel/status'),
      ]);
      setGithubStatus(ghRes.data.data);
      setVercelStatus(vcRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleGithubConnect = () => {
    if (!user?._id) return alert('Please log in again');
    window.location.href = `${API_BASE}/github/oauth/start?userId=${user._id}`;
  };

  const handleGithubDisconnect = async () => {
    if (!confirm('Disconnect GitHub?')) return;
    await api.post('/github/disconnect');
    fetchStatuses();
    setBanner({ type: 'success', text: 'GitHub disconnected' });
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

        {/* Account */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
            Account
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Shield size={14} /> Name
              </span>
              <span className="text-sm font-medium text-gray-900">{user?.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-100">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Mail size={14} /> Email
              </span>
              <span className="text-sm font-medium text-gray-900">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* GitHub */}
        {!loading && (
          <div className="mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <FaGithub size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">GitHub Integration</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Read repositories, commits, and file changes
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    githubStatus?.mode === 'oauth'
                      ? 'bg-emerald-50 text-emerald-700'
                      : githubStatus?.mode === 'pat'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {githubStatus?.connected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {githubStatus?.mode === 'oauth' ? 'Connected' : githubStatus?.mode === 'pat' ? 'Using server token' : 'Not connected'}
                </span>
              </div>

              {githubStatus?.mode === 'oauth' && githubStatus?.login && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
                  {githubStatus.avatar && (
                    <img
                      src={githubStatus.avatar}
                      alt={githubStatus.login}
                      className="w-9 h-9 rounded-full border border-emerald-200"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-900">@{githubStatus.login}</p>
                    <p className="text-xs text-emerald-700">Connected via OAuth</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {githubStatus?.mode !== 'oauth' ? (
                  <button
                    onClick={handleGithubConnect}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white
                      rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
                  >
                    <LinkIcon size={14} />
                    Connect GitHub
                  </button>
                ) : (
                  <button
                    onClick={handleGithubDisconnect}
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
        )}

        {/* Vercel - Read-only (token based) */}
        {!loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">▲</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Vercel Integration</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Deployment monitoring and auto-deploy
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  vercelStatus?.connected
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {vercelStatus?.connected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {vercelStatus?.connected ? 'Connected' : 'Not connected'}
              </span>
            </div>

            {vercelStatus?.connected && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs text-amber-800">
                  <strong>Server-configured token.</strong> All projects and deployments
                  are read using a server-side token. Per-user OAuth is documented as
                  future work.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;