import { motion } from 'framer-motion';
import { Server, Activity, DollarSign } from 'lucide-react';

const ServiceCard = ({ name, status, resources, cost, onConnect }) => {
  const statusConfig = {
    healthy: { dot: 'bg-emerald-500', label: 'Healthy', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    warning: { dot: 'bg-amber-500', label: 'Warning', text: 'text-amber-700', bg: 'bg-amber-50' },
    critical: { dot: 'bg-red-500', label: 'Critical', text: 'text-red-700', bg: 'bg-red-50' },
    unknown: { dot: 'bg-gray-400', label: 'Not connected', text: 'text-gray-600', bg: 'bg-gray-50' },
  };

  const s = statusConfig[status] || statusConfig.unknown;

  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-all cursor-pointer"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
            <Server size={16} className="text-gray-700" />
          </div>
          <span className="font-semibold text-gray-900">{name}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${s.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'healthy' ? 'animate-pulse' : ''}`} />
          <span className={`text-[11px] font-semibold ${s.text}`}>{s.label}</span>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Activity size={12} />
            Resources
          </span>
          <span className="font-mono text-gray-900 font-medium">{resources ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 flex items-center gap-1.5">
            <DollarSign size={12} />
            Cost today
          </span>
          <span className="font-mono text-gray-900 font-medium">
            {cost !== undefined ? `$${cost.toFixed(2)}` : '—'}
          </span>
        </div>
      </div>

      {status === 'unknown' && onConnect && (
        <button
          onClick={onConnect}
          className="mt-4 w-full py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg
            hover:bg-indigo-700 transition-colors"
        >
          Connect {name}
        </button>
      )}
    </motion.div>
  );
};

export default ServiceCard;