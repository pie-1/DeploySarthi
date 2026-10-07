import { useState } from 'react';
import { X, Triangle, Loader2, ExternalLink, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const ConnectVercelModal = ({ open, onClose, onConnected }) => {
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async () => {
    const trimmed = token.trim();
    if (!trimmed || trimmed.length < 20) {
      setError('Paste a valid Vercel token');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await api.post('/vercel/connect', { token: trimmed });
      toast.success(`Connected to Vercel as @${res.data.data.username}`);
      onConnected?.(res.data.data);
      setToken('');
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to connect';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
              <Triangle size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Connect Vercel</h2>
              <p className="text-xs text-gray-500">Deploy on your own Vercel account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Instructions */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <p className="text-sm font-semibold text-indigo-900 mb-2">
              How to get your Vercel token
            </p>
            <ol className="text-xs text-indigo-800 space-y-1.5 list-decimal list-inside">
              <li>Open Vercel account settings</li>
              <li>Go to the "Tokens" tab</li>
              <li>Click "Create Token"</li>
              <li>Name it "DeploySarthi", scope: Full Account</li>
              <li>Copy the token and paste below</li>
            </ol>
            <a
              href="https://vercel.com/account/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
            >
              Open Vercel Tokens page
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Token input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
              Vercel Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="vcp_..."
              className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Encrypted at rest with AES-256. Never shared with anyone.
            </p>
          </div>

          {/* Security note */}
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2">
            <Lock size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-800">
              Your token is encrypted before storage. It is only decrypted when making
              API calls on your behalf, and never logged.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
              <AlertCircle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !token.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold
              bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {saving ? 'Verifying...' : 'Connect Vercel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectVercelModal;