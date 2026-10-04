const SEVERITIES = ['all', 'critical', 'warning', 'info'];
const STATUSES = ['all', 'open', 'acknowledged', 'resolved'];

const FilterBar = ({ severity, status, onSeverityChange, onStatusChange, counts = {} }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Severity */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Severity
          </span>
          <div className="flex items-center gap-1">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                onClick={() => onSeverityChange(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize ${
                  severity === s
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {s}
                {counts[`severity_${s}`] !== undefined && (
                  <span className="ml-1.5 opacity-70">{counts[`severity_${s}`]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:block h-6 w-px bg-gray-200" />

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Status
          </span>
          <div className="flex items-center gap-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize ${
                  status === s
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {s}
                {counts[`status_${s}`] !== undefined && (
                  <span className="ml-1.5 opacity-70">{counts[`status_${s}`]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;