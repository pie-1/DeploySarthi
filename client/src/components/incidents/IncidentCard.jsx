import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SEVERITY_STYLES = {
  critical: {
    icon: AlertTriangle,
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
    label: 'Critical',
  },
  warning: {
    icon: Clock,
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'Warning',
  },
  info: {
    icon: CheckCircle2,
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    label: 'Info',
  },
};

const STATUS_LABELS = {
  open: { label: 'Open', style: 'bg-red-100 text-red-700' },
  acknowledged: { label: 'Acknowledged', style: 'bg-amber-100 text-amber-700' },
  resolved: { label: 'Resolved', style: 'bg-emerald-100 text-emerald-700' },
};

const IncidentCard = ({ incident, index = 0 }) => {
  const sev = SEVERITY_STYLES[incident.severity] || SEVERITY_STYLES.warning;
  const stat = STATUS_LABELS[incident.status] || STATUS_LABELS.open;
  const Icon = sev.icon;

  const startedAt = new Date(incident.startedAt);
  const timeAgo = getTimeAgo(startedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link
        to={`/incidents/${incident._id}`}
        className="group block bg-white border border-gray-200 rounded-2xl p-5
          hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all"
      >
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl ${sev.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={18} className={sev.text} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {incident.title}
              </h3>
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${stat.style}`}>
                {stat.label}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                {sev.label}
              </span>
              {incident.project?.name && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>{incident.project.name}</span>
                </>
              )}
              <span className="text-gray-300">·</span>
              <span>{timeAgo}</span>
            </div>

            {incident.aiAnalysis?.summary && (
              <p className="text-xs text-gray-600 line-clamp-2 bg-gray-50 px-3 py-2 rounded-lg">
                <span className="font-semibold text-gray-700">AI: </span>
                {incident.aiAnalysis.summary}
              </p>
            )}
          </div>

          <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-600 transition-colors flex-shrink-0 mt-3" />
        </div>
      </Link>
    </motion.div>
  );
};

function getTimeAgo(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default IncidentCard;