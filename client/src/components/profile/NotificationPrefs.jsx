import { useState, useEffect } from 'react';
import {
  Send, AlertCircle, CheckCircle2, Loader2,
  ExternalLink, X, ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';

const NotificationPrefs = ({ notifications, onUpdate }) => {
  const [prefs, setPrefs] = useState(notifications || {
    telegramEnabled: false,
    criticalOnly: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Telegram connection state
  const [tgStatus, setTgStatus] = useState(null);
  const [tgLoading, setTgLoading] = useState(true);
  const [linkData, setLinkData] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [error, setError] = useState('');

  // ─────────────────────────────────────────────
  // Fetch Telegram status on mount
  // ─────────────────────────────────────────────
  const fetchTgStatus = async () => {
    try {
      const res = await api.get('/telegram/status');
      setTgStatus(res.data.data);
    } catch (err) {
      setTgStatus({ connected: false, botConfigured: false });
    } finally {
      setTgLoading(false);
    }
  };

  useEffect(() => {
    fetchTgStatus();
  }, []);

  // Poll for connection while a link is active
  useEffect(() => {
    if (!linkData) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/telegram/status');
        if (res.data.data?.connected) {
          setTgStatus(res.data.data);
          setLinkData(null);
          setPrefs((p) => ({ ...p, telegramEnabled: true }));
          onUpdate({ ...prefs, telegramEnabled: true }).catch(() => {});
          clearInterval(interval);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [linkData]);

  // ─────────────────────────────────────────────
  // Toggle a preference
  // ─────────────────────────────────────────────
  const handleToggle = async (key) => {
    if (key === 'telegramEnabled' && !tgStatus?.connected) {
      setError('Connect Telegram first');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    setSaving(true);
    setSaved(false);

    try {
      await onUpdate(newPrefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setPrefs(prefs);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Generate Telegram link
  // ─────────────────────────────────────────────
  const handleConnectTelegram = async () => {
    setLinkLoading(true);
    setError('');
    try {
      const res = await api.post('/telegram/link');
      setLinkData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate link');
    } finally {
      setLinkLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Disconnect Telegram
  // ─────────────────────────────────────────────
  const handleDisconnectTelegram = async () => {
    if (!confirm('Disconnect Telegram? You will stop receiving alerts.')) return;
    try {
      await api.post('/telegram/disconnect');
      await fetchTgStatus();
      const newPrefs = { ...prefs, telegramEnabled: false };
      setPrefs(newPrefs);
      onUpdate(newPrefs).catch(() => {});
    } catch (err) {
      setError('Failed to disconnect');
    }
  };

  // ─────────────────────────────────────────────
  // Send test message
  // ─────────────────────────────────────────────
  const handleTestTelegram = async () => {
    try {
      await api.post('/telegram/test');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Test failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  const items = [
    {
      key: 'telegramEnabled',
      icon: Send,
      title: 'Telegram Alerts',
      desc: tgStatus?.connected
        ? `Connected${tgStatus.username ? ` as @${tgStatus.username}` : ''}`
        : 'Connect Telegram to enable',
      disabled: !tgStatus?.connected,
    },
    {
      key: 'criticalOnly',
      icon: AlertCircle,
      title: 'Critical incidents only',
      desc: 'Skip warnings, only alert on critical',
      disabled: false,
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Notification Preferences
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            How you want to be alerted about incidents
          </p>
        </div>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 size={12} />
            Saved
          </span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
          <AlertCircle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Telegram connection card */}
      <div className="mx-6 mt-4 mb-2">
        {tgLoading ? (
          <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
            <Loader2 size={16} className="animate-spin text-gray-400" />
            <span className="text-xs text-gray-500">Checking Telegram status...</span>
          </div>
        ) : !tgStatus?.botConfigured ? (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-xs text-amber-800">
              <strong>Telegram bot not configured on server.</strong> Add
              <code className="mx-1 px-1 bg-amber-100 rounded">TELEGRAM_BOT_TOKEN</code>
              to enable alerts.
            </p>
          </div>
        ) : tgStatus.connected ? (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                <ShieldCheck size={16} className="text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Connected{tgStatus.username ? ` as @${tgStatus.username}` : ''}
                </p>
                <p className="text-xs text-emerald-700">
                  Alerts will be sent to your Telegram chat
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTestTelegram}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Test
              </button>
              <button
                onClick={handleDisconnectTelegram}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : linkData ? (
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-semibold text-indigo-900">
                  Almost there — open Telegram
                </p>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Click the link, press Start, and this page will update automatically.
                </p>
              </div>
              <button
                onClick={() => setLinkData(null)}
                className="p-1 text-indigo-400 hover:text-indigo-700"
              >
                <X size={14} />
              </button>
            </div>
            <a
              href={linkData.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg
                text-sm font-semibold hover:bg-indigo-700"
            >
              <Send size={14} />
              Open in Telegram
              <ExternalLink size={12} />
            </a>
            <p className="text-[11px] text-indigo-600 mt-2 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" />
              Waiting for connection...
            </p>
          </div>
        ) : (
          <button
            onClick={handleConnectTelegram}
            disabled={linkLoading}
            className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2
              text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:bg-indigo-50
              transition-colors disabled:opacity-60"
          >
            {linkLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Connect Telegram
          </button>
        )}
      </div>

      {/* Preference toggles */}
      {items.map((item, i) => {
        const Icon = item.icon;
        const enabled = prefs[item.key];
        return (
          <div
            key={item.key}
            className={`flex items-center gap-4 px-6 py-4 ${
              i !== items.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              enabled && !item.disabled ? 'bg-indigo-50' : 'bg-gray-100'
            }`}>
              <Icon
                size={16}
                className={enabled && !item.disabled ? 'text-indigo-600' : 'text-gray-400'}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>

            <button
              onClick={() => handleToggle(item.key)}
              disabled={item.disabled || saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${enabled && !item.disabled ? 'bg-indigo-600' : 'bg-gray-200'}
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                  ${enabled && !item.disabled ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationPrefs;