const SERVICE_COLORS = {
  aws: { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50' },
  vercel: { bg: 'bg-black', text: 'text-gray-900', light: 'bg-gray-100' },
  supabase: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50' },
  github: { bg: 'bg-violet-500', text: 'text-violet-700', light: 'bg-violet-50' },
  default: { bg: 'bg-indigo-500', text: 'text-indigo-700', light: 'bg-indigo-50' },
};

const Timeline = ({ events = [] }) => {
  if (events.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Timeline</h3>
        <p className="text-sm text-gray-500">No timeline data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-5">Incident Timeline</h3>

      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-2 top-1 bottom-1 w-px bg-gray-200" />

        <div className="space-y-4">
          {events.map((event, i) => {
            const colors = SERVICE_COLORS[event.service] || SERVICE_COLORS.default;
            return (
              <div key={i} className="relative">
                {/* Dot */}
                <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white
                  ${colors.bg} shadow`} />

                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-gray-500 flex-shrink-0 w-16">
                    {event.timestamp?.slice(11, 19) || '—'}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${colors.light} ${colors.text}`}>
                        {event.service}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{event.event || event.metric}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;