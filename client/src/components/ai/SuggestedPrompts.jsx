import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, HelpCircle, ChevronRight } from 'lucide-react';

const SuggestedPrompts = ({ suggestions = [], onSelect, loading }) => {
  const [showReason, setShowReason] = useState(null);

  const priorityStyle = {
    high: 'border-red-200 bg-red-50/50 hover:bg-red-50',
    medium: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50',
    low: 'border-gray-200 bg-gray-50/50 hover:bg-gray-50',
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-xl">
        <Sparkles size={24} className="text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No suggestions yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Create an incident to see suggested investigations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {suggestions.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`relative rounded-xl border transition-colors cursor-pointer ${
            priorityStyle[s.priority] || priorityStyle.low
          }`}
          onClick={() => onSelect(s.question)}
        >
          <div className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-900 flex-1">
                {s.question}
              </p>
              <ChevronRight size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-white rounded text-gray-600">
                {s.type?.replace(/_/g, ' ') || 'investigation'}
              </span>
              {s.priority === 'high' && (
                <span className="text-[10px] font-bold text-red-600">HIGH PRIORITY</span>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReason(showReason === i ? null : i);
              }}
              className="inline-flex items-center gap-1 mt-2 text-[11px] text-gray-500
                hover:text-gray-700 underline decoration-dotted"
            >
              <HelpCircle size={10} />
              Why this question?
            </button>

            {showReason === i && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-gray-600 mt-2 pl-3 border-l-2 border-gray-300"
              >
                {s.reason}
              </motion.p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SuggestedPrompts;