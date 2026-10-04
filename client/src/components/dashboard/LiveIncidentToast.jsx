import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLiveData } from '../../context/LiveDataContext';

const LiveIncidentToast = () => {
  const { toastQueue, removeToast } = useLiveData();
  const navigate = useNavigate();

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (toastQueue.length === 0) return;
    const timers = toastQueue.map((toast) =>
      setTimeout(() => removeToast(toast.id), 8000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toastQueue, removeToast]);

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm">
      <AnimatePresence>
        {toastQueue.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white border border-red-200 rounded-2xl shadow-xl p-4
              flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-red-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">
                New Incident
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {toast.data.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {toast.data.project?.name}
              </p>

              <button
                onClick={() => {
                  navigate(`/incidents/${toast.data._id}`);
                  removeToast(toast.id);
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold
                  text-indigo-600 hover:text-indigo-700"
              >
                View incident
                <ArrowRight size={12} />
              </button>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <X size={14} className="text-gray-400" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default LiveIncidentToast;