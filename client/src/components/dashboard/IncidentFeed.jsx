import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const IncidentFeed = ({ incidents = [], loading = false }) => {
  const severityIcon = (severity) => {
    if (severity === 'critical') return AlertTriangle;
    if (severity === 'warning') return Clock;
    return CheckCircle2;
  };

  const severityStyle = (severity) => {
    if (severity === 'critical') return { text: 'text-red-600', bg: 'bg-red-50' };
    if (severity === 'warning') return { text: 'text-amber-600', bg: 'bg-amber-50' };
    return { text: 'text-emerald-600', bg: 'bg-emerald-50' };
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Recent Incidents</h3>
        <Link to="/incidents" className="text-xs text-indigo-600 hover:underline font-medium">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">All systems healthy</p>
          <p className="text-xs text-gray-500 mt-1">No incidents detected</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {incidents.map((incident, i) => {
              const Icon = severityIcon(incident.severity);
              const style = severityStyle(incident.severity);
              return (
                <motion.div
                  key={incident._id || i}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/incidents/${incident._id}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon size={14} className={style.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {incident.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {incident.project?.name || 'Project'} · {' '}
                        {new Date(incident.startedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}
                    >
                      {incident.severity}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default IncidentFeed;