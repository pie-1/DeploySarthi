import { Folder, Activity, CheckCircle2, GitBranch, Server } from 'lucide-react';

const StatsGrid = ({ stats }) => {
  const cards = [
    {
      label: 'Projects',
      value: stats?.projects ?? 0,
      icon: Folder,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Active Incidents',
      value: stats?.activeIncidents ?? 0,
      icon: Activity,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Resolved',
      value: stats?.resolvedIncidents ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Integrations',
      value: (stats?.githubConnected ? 1 : 0) + (stats?.vercelConnected ? 1 : 0),
      icon: Server,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
        >
          <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
            <c.icon size={18} className={c.color} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{c.value}</p>
          <p className="text-xs text-gray-500 mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;