import { Link } from 'react-router-dom';
import { Package, AlertTriangle, CheckCircle2, Rocket } from 'lucide-react';

const ICONS = {
  project_created: { icon: Package, bg: 'bg-indigo-50', color: 'text-indigo-600' },
  incident_created: { icon: AlertTriangle, bg: 'bg-amber-50', color: 'text-amber-600' },
  incident_resolved: { icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const ActivityFeed = ({ activities = [], loading }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Recent Activity
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Your latest actions and incidents
        </p>
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="p-12 text-center">
          <Rocket size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">No activity yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Create a project to get started
          </p>
        </div>
      ) : (
        <div>
          {activities.map((a, i) => {
            const meta = ICONS[a.type] || ICONS.project_created;
            const Icon = meta.icon;
            const link = a.meta?.projectId
              ? `/projects/${a.meta.projectId}`
              : a.meta?.incidentId
              ? `/incidents/${a.meta.incidentId}`
              : null;

            const content = (
              <div
                className={`flex items-start gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors ${
                  i !== activities.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon size={14} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 line-clamp-1">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{timeAgo(a.timestamp)}</p>
                </div>
              </div>
            );

            return link ? (
              <Link key={i} to={link}>
                {content}
              </Link>
            ) : (
              <div key={i}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;