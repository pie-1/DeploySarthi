import { Link } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa';
import { CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';

const ConnectedAccounts = ({ stats }) => {
  const accounts = [
    {
      name: 'GitHub',
      icon: <FaGithub size={20} className="text-white" />,
      bgColor: 'bg-gray-900',
      connected: stats?.githubConnected,
    },
    {
      name: 'Vercel',
      icon: <span className="text-white font-bold text-lg">▲</span>,
      bgColor: 'bg-black',
      connected: stats?.vercelConnected,
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Connected Accounts
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Services connected to your account
        </p>
      </div>

      {accounts.map((acc, i) => (
        <Link
          key={acc.name}
          to="/settings"
          className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
            i !== accounts.length - 1 ? 'border-b border-gray-100' : ''
          }`}
        >
          <div className={`w-10 h-10 rounded-lg ${acc.bgColor} flex items-center justify-center flex-shrink-0`}>
            {acc.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{acc.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {acc.connected ? 'Connected' : 'Not connected'}
            </p>
          </div>
          {acc.connected ? (
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-gray-300 flex-shrink-0" />
          )}
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        </Link>
      ))}
    </div>
  );
};

export default ConnectedAccounts;