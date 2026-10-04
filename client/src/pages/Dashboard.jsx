import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Server, AlertTriangle, DollarSign, Plus,
  ArrowUpRight, TrendingUp, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { projectService, incidentService, aiService } from '../services/projectService';
import ServiceCard from '../components/dashboard/ServiceCard';
import IncidentFeed from '../components/dashboard/IncidentFeed';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';
import { LatencyChart, CpuChart } from '../components/dashboard/MetricChart';

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [projectsRes, incidentsRes, aiRes] = await Promise.allSettled([
        projectService.getAll(),
        incidentService.getAll(),
        aiService.health(),
      ]);

      if (projectsRes.status === 'fulfilled') {
        setProjects(projectsRes.value.data || []);
      } else {
        console.error('Failed to load projects:', projectsRes.reason);
      }

      if (incidentsRes.status === 'fulfilled') {
        setIncidents(incidentsRes.value.data || []);
      }

      if (aiRes.status === 'fulfilled') {
        setAiStatus(aiRes.value.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeIncidents = incidents.filter((i) => i.status === 'open').length;
  const totalCost = projects.reduce((sum, p) => sum + (p.costToday || 0), 0);
  const healthScore = Math.max(0, 100 - activeIncidents * 15);

  const services = [
    { name: 'AWS', status: 'unknown', resources: '—', cost: undefined },
    { name: 'Vercel', status: 'unknown', resources: '—', cost: undefined },
    { name: 'Supabase', status: 'unknown', resources: '—', cost: undefined },
  ];

  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  return (
    <div className="pb-16 px-6">
      <div className="max-w-7xl mx-auto pt-8">
        {/* ============ HEADER ============ */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-sm text-gray-600 mt-1.5">
              {projects.length === 0
                ? 'Create your first project to start monitoring'
                : `You have ${projects.length} project${projects.length > 1 ? 's' : ''} being monitored`}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold
              rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/20
              hover:shadow-md hover:shadow-indigo-500/30"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ============ HERO STATS BAR ============ */}
        <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50
          border border-indigo-100 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Health Score */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  System Health
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">{healthScore}</span>
                <span className="text-sm text-gray-500">/ 100</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {healthScore >= 80 ? 'All systems healthy' : 'Attention needed'}
              </p>
            </div>

            {/* Projects */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Projects
              </span>
              <span className="text-3xl font-bold text-gray-900">{projects.length}</span>
              <p className="text-xs text-gray-500 mt-1">
                {projects.length === 0 ? 'None yet' : 'Actively monitored'}
              </p>
            </div>

            {/* Incidents */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Active Incidents
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold ${activeIncidents > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {activeIncidents}
                </span>
                {activeIncidents === 0 && <CheckCircle2 size={20} className="text-emerald-500" />}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {activeIncidents === 0 ? 'All clear' : 'Needs attention'}
              </p>
            </div>

            {/* Cost */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Cost Today
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">${totalCost.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Across all services</p>
            </div>
          </div>
        </div>

        {/* ============ CHARTS ROW ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <LatencyChart />
          <CpuChart />
        </div>

        {/* ============ SERVICES ROW ============ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Connected Services</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Connect AWS, Vercel, or Supabase to begin monitoring
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map((s) => (
              <ServiceCard key={s.name} {...s} onConnect={() => alert('Coming soon')} />
            ))}
          </div>
        </div>

        {/* ============ BOTTOM ROW: PROJECTS + INCIDENTS ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Your Projects</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {projects.length} project{projects.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {projects.length > 0 && (
                  <Link
                    to="/projects"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold
                      flex items-center gap-1"
                  >
                    View all <ArrowUpRight size={12} />
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Plus size={22} className="text-indigo-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">No projects yet</h4>
                  <p className="text-xs text-gray-500 mb-5 max-w-xs mx-auto">
                    Create your first project to start monitoring deployments, incidents, and costs.
                  </p>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg
                      hover:bg-indigo-700 transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((p) => (
                    <Link
                      key={p._id}
                      to={`/projects/${p._id}`}
                      className="flex items-center justify-between p-4 rounded-xl
                        hover:bg-gray-50 transition-colors border border-transparent
                        hover:border-gray-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                          <Server size={16} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {p.environment} · {p.deploymentTarget}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight size={14} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Incidents Feed */}
          <div>
            <IncidentFeed incidents={incidents.slice(0, 5)} loading={loading} />
          </div>
        </div>
      </div>

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  );
};

export default Dashboard;