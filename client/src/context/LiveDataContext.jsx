import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';

const LiveDataContext = createContext(null);

const MAX_INCIDENTS = 20;
const MAX_METRICS_PER_PROJECT = 30; // Keep last 30 readings per project

export const LiveDataProvider = ({ children }) => {
  const { user } = useAuth();
  const { isConnected, subscribe } = useWebSocket();
  const [liveMetrics, setLiveMetrics] = useState({});
  const [liveIncidents, setLiveIncidents] = useState([]);
  const [toastQueue, setToastQueue] = useState([]);

  // Only run when user is logged in
  useEffect(() => {
    if (!user) return;

    const unsubMetrics = subscribe('metrics:update', (data) => {
      setLiveMetrics((prev) => {
        const projectId = data.projectId;
        const existing = prev[projectId] || [];
        const updated = [...existing, {
          ...data.metrics,
          timestamp: new Date().toISOString(),
          tick: data.tick,
        }];
        // Keep only last N readings
        return {
          ...prev,
          [projectId]: updated.slice(-MAX_METRICS_PER_PROJECT),
        };
      });
    });

    const unsubCreated = subscribe('incident:created', (data) => {
      setLiveIncidents((prev) => [data, ...prev].slice(0, MAX_INCIDENTS));
      setToastQueue((prev) => [...prev, { type: 'new_incident', data, id: Date.now() }]);
    });

    const unsubAnalyzed = subscribe('incident:analyzed', (data) => {
      setLiveIncidents((prev) =>
        prev.map((inc) =>
          inc._id === data._id
            ? { ...inc, aiAnalysis: data.aiAnalysis, timeline: data.timeline }
            : inc
        )
      );
    });

    return () => {
      unsubMetrics();
      unsubCreated();
      unsubAnalyzed();
    };
  }, [user, subscribe]);

  const removeToast = (id) => {
    setToastQueue((prev) => prev.filter((t) => t.id !== id));
  };

  const getMetricsForProject = (projectId) => liveMetrics[projectId] || [];

  return (
    <LiveDataContext.Provider
      value={{
        isConnected,
        liveMetrics,
        getMetricsForProject,
        liveIncidents,
        toastQueue,
        removeToast,
      }}
    >
      {children}
    </LiveDataContext.Provider>
  );
};

export const useLiveData = () => {
  const ctx = useContext(LiveDataContext);
  if (!ctx) throw new Error('useLiveData must be used inside <LiveDataProvider>');
  return ctx;
};