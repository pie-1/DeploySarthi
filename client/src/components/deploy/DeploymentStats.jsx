import { Rocket, CheckCircle2, Loader2, XCircle } from 'lucide-react';

const DeploymentStats = ({ deployments = [] }) => {
  const total = deployments.length;
  const ready = deployments.filter((d) => d.state === 'READY').length;
  const building = deployments.filter((d) =>
    ['BUILDING', 'QUEUED', 'INITIALIZING'].includes(d.state)
  ).length;
  const errors = deployments.filter((d) =>
    ['ERROR', 'CANCELED'].includes(d.state)
  ).length;

  const stats = [
    { label: 'Total', value: total, icon: Rocket, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Ready', value: ready, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Building', value: building, icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Failed', value: errors, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
            <s.icon size={18} className={s.color} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{s.value}</p>
          <p className="text-xs text-gray-500 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
};

export default DeploymentStats;