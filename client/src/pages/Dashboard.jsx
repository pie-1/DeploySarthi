import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Server, AlertTriangle, DollarSign, Plus,
  ArrowUpRight, CheckCircle2,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useLiveData } from '../context/LiveDataContext';
import { projectService, incidentService, aiService } from '../services/projectService';
import IncidentFeed from '../components/dashboard/IncidentFeed';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';
import { LatencyChart, CpuChart } from '../components/dashboard/MetricChart';
import LiveMetricsPanel from '../components/dashboard/LiveMetricsPanel';
import ConnectionStatus from '../components/dashboard/ConnectionStatus';

const Dashboard = () => {
  const { user } = useAuth();
  const { liveIncidents } = useLiveData();
  const [projects, setProjects] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [githubStatus, setGithubStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, incidentsRes, aiRes, ghRes] = await Promise.allSettled([
        projectService.getAll(),
        incidentService.getAll(),
        aiService.health(),
        fetch('http://localhost:5000/api/github/status', {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('deploysarthi_user'))?.token}`,
          },
        }).then((r) => r.json()),
      ]);

      if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.data || []);
      if (incidentsRes.status === 'fulfilled') setIncidents(incidentsRes.value.data || []);
      if (aiRes.status === 'fulfilled') setAiStatus(aiRes.value.data);
      if (ghRes.status === 'fulfilled') setGithubStatus(ghRes.value.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const allIncidents = [
    ...liveIncidents,
    ...incidents.filter((i) => !liveIncidents.find((l) => l._id === i._id)),
  ];

  const activeIncidents = allIncidents.filter((i) => i.status === 'open').length;
  const totalCost = projects.reduce((sum, p) => sum + (p.costToday || 0), 0);
  const healthScore = Math.max(0, 100 - activeIncidents * 15);

  const primaryProject = projects[0];
  const isGithubConnected = githubStatus?.connected === true;
  const isAiOnline = aiStatus?.model_loaded === true;

  return (
    <div className="pb-16 px-6">
      <div className="max-w-7xl mx-auto pt-8">
        {/* ============ HEADER ============ */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}
              </h1>
              <ConnectionStatus />
            </div>
            <p className="text-sm text-gray-600 mt-1.5">
              {projects.length === 0
                ? 'Create your first project to start monitoring'
                : `Monitoring ${projects.length} project${projects.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold
              rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/20"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {/* ============ HERO STATS ============ */}
        <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50
          border border-indigo-100 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                System Health
              </p>
              <span className="text-3xl font-bold text-gray-900">{healthScore}</span>
              <span className="text-sm text-gray-500">/ 100</span>
              <p className="text-xs text-gray-500 mt-1">
                {healthScore >= 80 ? 'All systems healthy' : 'Attention needed'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Projects
              </p>
              <span className="text-3xl font-bold text-gray-900">{projects.length}</span>
              <p className="text-xs text-gray-500 mt-1">Actively monitored</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Active Incidents
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold ${activeIncidents > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {activeIncidents}
                </span>
                {activeIncidents === 0 && <CheckCircle2 size={20} className="text-emerald-500" />}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Cost Today
              </p>
              <span className="text-3xl font-bold text-gray-900">${totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ============ INTEGRATIONS ============ */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* GitHub */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                    <FaGithub size={16} className="text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">GitHub</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${
                  isGithubConnected
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isGithubConnected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {isGithubConnected ? 'CONNECTED' : 'NOT CONNECTED'}
                </span>
              </div>
              <p className="text-xs text-gray-500">Repos, commits, deployment history</p>
              {isGithubConnected && githubStatus?.login && (
                <p className="text-xs text-emerald-700 mt-2 font-medium">
                  @{githubStatus.login}
                </p>
              )}
            </div>

            {/* AI Service */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Activity size={16} className="text-indigo-600" />
                  </div>
                  <span className="font-semibold text-gray-900">AI Service</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${
                  isAiOnline
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isAiOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {isAiOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-gray-500">Anomaly detection + LLM investigation</p>
            </div>

            {/* Vercel — Coming Soon */}
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-5 opacity-70">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Server size={16} className="text-gray-400" />
                  </div>
                  <span className="font-semibold text-gray-500">Vercel</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold">
                  SOON
                </span>
              </div>
              <p className="text-xs text-gray-400">Deployments + build logs</p>
            </div>
          </div>
        </div>

        {/* ============ LIVE METRICS ============ */}
        {primaryProject && (
          <div className="mb-8">
            <LiveMetricsPanel projectId={primaryProject._id} />
          </div>
        )}

        {/* ============ CHARTS ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <LatencyChart />
          <CpuChart />
        </div>

        {/* ============ PROJECTS + INCIDENTS ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-gray-900">Your Projects</h3>
                {projects.length > 0 && (
                  <Link
                    to="/projects"
                    className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    View all <ArrowUpRight size={12} />
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Plus size={22} className="text-indigo-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">No projects yet</p>
                  <p className="text-xs text-gray-500 mb-5">
                    Create your first project to start monitoring
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
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600">
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {p.githubRepo || `${p.environment} · ${p.deploymentTarget}`}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight size={14} className="text-gray-300 group-hover:text-indigo-600" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <IncidentFeed incidents={allIncidents.slice(0, 5)} loading={loading} />
          </div>
        </div>
      </div>

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(p) => setProjects((prev) => [p, ...prev])}
      />
    </div>
  );
};

export default Dashboard;