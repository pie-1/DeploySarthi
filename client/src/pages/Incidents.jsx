import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle2 } from 'lucide-react';
import { incidentService, projectService } from '../services/projectService';
import { useLiveData } from '../context/LiveDataContext';
import IncidentCard from '../components/incidents/IncidentCard';
import FilterBar from '../components/incidents/FilterBar';

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { liveIncidents } = useLiveData();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [incidentsRes, projectsRes] = await Promise.all([
        incidentService.getAll(),
        projectService.getAll(),
      ]);
      setIncidents(incidentsRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (err) {
      setError('Failed to load incidents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When a new incident arrives via WebSocket, refresh from REST
  useEffect(() => {
    if (liveIncidents.length === 0) return;
    // Fetch once to get the latest set
    fetchData();
  }, [liveIncidents.length, fetchData]);

  // Merge: REST incidents + live incidents (deduplicated by _id)
  const merged = [
    ...liveIncidents,
    ...incidents.filter((i) => !liveIncidents.find((l) => l._id === i._id)),
  ].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

  const filtered = merged.filter((i) => {
    if (severity !== 'all' && i.severity !== severity) return false;
    if (status !== 'all' && i.status !== status) return false;
    return true;
  });

  const counts = {
    severity_all: merged.length,
    severity_critical: merged.filter((i) => i.severity === 'critical').length,
    severity_warning: merged.filter((i) => i.severity === 'warning').length,
    severity_info: merged.filter((i) => i.severity === 'info').length,
    status_all: merged.length,
    status_open: merged.filter((i) => i.status === 'open').length,
    status_acknowledged: merged.filter((i) => i.status === 'acknowledged').length,
    status_resolved: merged.filter((i) => i.status === 'resolved').length,
  };

  const handleCreateTestIncident = async () => {
    if (projects.length === 0) {
      alert('Create a project first before creating an incident.');
      navigate('/projects');
      return;
    }

    const projectId = projects[0]._id;
    try {
      await incidentService.create({
        projectId,
        title: `Test Incident — ${new Date().toLocaleTimeString()}`,
        severity: 'warning',
        symptoms: [
          { service: 'vercel', metric: 'latency_ms', value: 820, baseline: 180, changePercent: 355.6 },
          { service: 'aws', metric: 'cpu_pct', value: 78, baseline: 22, changePercent: 254.5 },
        ],
        timeline: [
          { timestamp: new Date().toISOString(), service: 'vercel', event: 'Latency spike detected' },
          { timestamp: new Date().toISOString(), service: 'aws', event: 'CPU usage elevated' },
        ],
        relatedDeployment: {
          commitId: 'abc123',
          branch: 'main',
          filesChanged: ['api/routes/orders.js'],
        },
      });
      fetchData();
    } catch (err) {
      console.error('Failed to create incident:', err);
      alert('Failed to create test incident');
    }
  };

  return (
    <div className="pb-16 px-6">
      <div className="max-w-7xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Incidents</h1>
            <p className="text-sm text-gray-600 mt-1.5">
              {merged.length === 0
                ? 'All systems running smoothly'
                : `${merged.length} incident${merged.length > 1 ? 's' : ''} recorded`}
            </p>
          </div>
          <button
            onClick={handleCreateTestIncident}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold
              rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Plus size={16} />
            Create Test Incident
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {merged.length > 0 && (
          <FilterBar
            severity={severity}
            status={status}
            onSeverityChange={setSeverity}
            onStatusChange={setStatus}
            counts={counts}
          />
        )}

        {/* Content */}
        {loading && merged.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white border border-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : merged.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={26} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">All systems healthy</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              No incidents detected. When something goes wrong, you'll see it here with an AI-powered explanation.
            </p>
            <button
              onClick={handleCreateTestIncident}
              className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl
                hover:bg-indigo-700 transition-colors"
            >
              Create a Test Incident
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <p className="text-sm text-gray-500">No incidents match the current filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((incident, i) => (
              <IncidentCard key={incident._id} incident={incident} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Incidents;