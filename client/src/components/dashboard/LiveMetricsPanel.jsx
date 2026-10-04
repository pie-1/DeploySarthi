import { Activity } from 'lucide-react';
import { useLiveData } from '../../context/LiveDataContext';

const METRIC_LABELS = {
  latency_ms: { label: 'Latency', unit: 'ms', thresholds: [500, 1000] },
  error_rate_pct: { label: 'Error Rate', unit: '%', thresholds: [5, 15] },
  cpu_pct: { label: 'CPU', unit: '%', thresholds: [75, 90] },
  memory_pct: { label: 'Memory', unit: '%', thresholds: [80, 90] },
  db_connections: { label: 'DB Connections', unit: '', thresholds: [70, 85] },
};

function getStatus(value, thresholds) {
  if (!thresholds) return 'normal';
  if (value >= thresholds[1]) return 'critical';
  if (value >= thresholds[0]) return 'warning';
  return 'normal';
}

const LiveMetricsPanel = ({ projectId }) => {
  const { getMetricsForProject, isConnected } = useLiveData();
  const readings = getMetricsForProject(projectId);

  if (!isConnected) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Live Metrics</h3>
        </div>
        <p className="text-sm text-gray-500">Connecting to monitoring stream...</p>
      </div>
    );
  }

  if (readings.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">Live Metrics</h3>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <p className="text-sm text-gray-500">Waiting for first reading...</p>
      </div>
    );
  }

  const latest = readings[readings.length - 1];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">Live Metrics</h3>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <span className="text-[10px] font-mono text-gray-400">
          tick {latest.tick}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(METRIC_LABELS).map(([key, meta]) => {
          const value = latest[key];
          const status = getStatus(value, meta.thresholds);

          const statusStyles = {
            normal: 'border-gray-200 bg-gray-50',
            warning: 'border-amber-300 bg-amber-50',
            critical: 'border-red-300 bg-red-50',
          };

          const valueStyles = {
            normal: 'text-gray-900',
            warning: 'text-amber-700',
            critical: 'text-red-700',
          };

          return (
            <div
              key={key}
              className={`rounded-xl border p-3 transition-colors ${statusStyles[status]}`}
            >
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {meta.label}
              </p>
              <p className={`text-lg font-bold font-mono ${valueStyles[status]}`}>
                {typeof value === 'number' ? value.toFixed(1) : value}
                <span className="text-xs font-normal text-gray-500 ml-1">{meta.unit}</span>
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 mt-3">
        Last update: {new Date(latest.timestamp).toLocaleTimeString()}
      </p>
    </div>
  );
};

export default LiveMetricsPanel;