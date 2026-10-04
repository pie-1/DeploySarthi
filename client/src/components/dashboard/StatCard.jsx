import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ label, value, unit = '', icon: Icon, color = 'indigo', trend }) => {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', value: 'text-indigo-900' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', value: 'text-emerald-900' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', value: 'text-amber-900' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', value: 'text-red-900' },
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-all"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          {Icon && <Icon size={18} className={c.icon} />}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold flex items-center gap-1 ${
            trend > 0 ? 'text-red-600' : 'text-emerald-600'
          }`}>
            {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${c.value}`}>{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </motion.div>
  );
};

export default StatCard;