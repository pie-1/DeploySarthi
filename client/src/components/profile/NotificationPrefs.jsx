import { useState } from 'react';
import { MessageCircle, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

const NotificationPrefs = ({ notifications, phone, onUpdate }) => {
  const [prefs, setPrefs] = useState(notifications || {
    whatsappEnabled: false,
    emailEnabled: true,
    criticalOnly: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleToggle = async (key) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    setSaving(true);
    setSaved(false);

    try {
      await onUpdate(newPrefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      // Revert on error
      setPrefs(prefs);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const whatsappDisabled = !phone;

  const items = [
    {
      key: 'whatsappEnabled',
      icon: MessageCircle,
      title: 'WhatsApp Alerts',
      desc: whatsappDisabled
        ? 'Add a phone number to enable'
        : phone
        ? `Sent to ${phone}`
        : 'Receive alerts on WhatsApp',
      disabled: whatsappDisabled,
    },
    {
      key: 'emailEnabled',
      icon: Mail,
      title: 'Email Alerts',
      desc: 'Receive alerts via email',
      disabled: false,
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
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                disabled:cursor-not-allowed`}
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