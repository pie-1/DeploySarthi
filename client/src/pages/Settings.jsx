import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa';
import {
  CheckCircle2, AlertCircle, LinkIcon, Unlink, Mail, Shield,
  Triangle, Lock, ExternalLink, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import ConnectVercelModal from '../components/settings/ConnectVercelModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Settings = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [githubStatus, setGithubStatus] = useState(null);
  const [vercelStatus, setVercelStatus] = useState(null);
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vercelModalOpen, setVercelModalOpen] = useState(false);

  useEffect(() => {
    const github = searchParams.get('github');
    if (github === 'success') {
      toast.success('GitHub connected successfully');
      setSearchParams({}, { replace: true });
    } else if (github === 'error') {
      toast.error('Failed to connect GitHub');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchStatuses = async () => {
    try {
      const [ghRes, vcRes, tgRes] = await Promise.all([
        api.get('/github/status'),
        api.get('/vercel/status'),
        api.get('/telegram/status'),
      ]);
      setGithubStatus(ghRes.data.data);
      setVercelStatus(vcRes.data.data);
      setTelegramStatus(tgRes.data.data);
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
    if (!user?._id) return toast.error('Please log in again');
    window.location.href = `${API_BASE}/github/oauth/start?userId=${user._id}`;
  };

  const handleGithubDisconnect = async () => {
    if (!confirm('Disconnect GitHub?')) return;
    try {
      await api.post('/github/disconnect');
      await fetchStatuses();
      toast.success('GitHub disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const handleVercelDisconnect = async () => {
    if (!confirm('Disconnect Vercel? Deployments will stop working.')) return;
    try {
      await api.post('/vercel/disconnect');
      await fetchStatuses();
      toast.success('Vercel disconnected');
    } catch {
      toast.error('Failed to disconnect');
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
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <FaGithub size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">GitHub</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Repositories, commits, and deployment history
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  githubStatus?.connected
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {githubStatus?.connected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {githubStatus?.connected ? 'Connected' : 'Not connected'}
              </span>
            </div>

            {githubStatus?.connected && githubStatus?.login && (
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
              {!githubStatus?.connected ? (
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
        )}

        {/* Vercel */}
        {!loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                  <Triangle size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Vercel</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Deploy your projects on your own Vercel account
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

            {vercelStatus?.connected ? (
              <>
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Triangle size={16} className="text-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-900">
                      @{vercelStatus.username}
                    </p>
                    <p className="text-xs text-emerald-700">
                      {vercelStatus.teamName || 'Personal account'} · {vercelStatus.maskedToken}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setVercelModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700
                      rounded-lg text-sm font-semibold hover:bg-gray-50"
                  >
                    Update token
                  </button>
                  <button
                    onClick={handleVercelDisconnect}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white
                      rounded-lg text-sm font-semibold hover:bg-red-700"
                  >
                    <Unlink size={14} />
                    Disconnect
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg mb-4 flex items-start gap-2">
                  <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800">
                    <strong>Connect your Vercel account</strong> so DeploySarthi can deploy projects
                    on your behalf. Your token stays encrypted on our server.
                  </p>
                </div>

                {vercelStatus?.serverFallbackAvailable && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4 flex items-start gap-2">
                    <Lock size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">
                      Running on the server's shared Vercel token. Connect your own for full
                      control.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setVercelModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white
                    rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  <LinkIcon size={14} />
                  Connect Vercel
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <ConnectVercelModal
        open={vercelModalOpen}
        onClose={() => setVercelModalOpen(false)}
        onConnected={() => fetchStatuses()}
      />
    </div>
  );
};

export default Settings;