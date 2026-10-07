import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, Rocket, Activity,
  TrendingUp, TrendingDown, ArrowRight, DollarSign,
  Clock, GitBranch, Server,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import ConnectionStatus from '../components/dashboard/ConnectionStatus';
import LiveMetricsPanel from '../components/dashboard/LiveMetricsPanel';
import { LatencyChart, CpuChart } from '../components/dashboard/MetricChart';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/summary');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="pb-16 px-6">
        <div className="max-w-7xl mx-auto pt-8">
          <div className="h-10 w-64 bg-gray-100 rounded-lg animate-pulse mb-8" />
          <div className="h-20 bg-white border border-gray-200 rounded-2xl animate-pulse mb-6" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white border border-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const needsAttention = data?.needsAttention || [];
  const projects = data?.projects || [];
  const activity = data?.activity || [];
  const cost = data?.cost || { today: 0, currency: 'USD' };
  const primaryProject = projects[0];

  const overallStatus = summary.overallStatus || 'healthy';
  const statusConfig = {
    healthy: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'All systems healthy' },
    warning: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', label: 'Some warnings' },
    critical: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', label: 'Attention required' },
  };
  const sc = statusConfig[overallStatus];

  return (
    <div className="pb-16 px-6">
      <div className="max-w-7xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}
              </h1>
              <ConnectionStatus />
            </div>
            <p className="text-sm text-gray-600 mt-1.5">
              {summary.totalProjects === 0
                ? 'Deploy your first project to start monitoring'
                : `${summary.totalProjects} project${summary.totalProjects > 1 ? 's' : ''} · ${summary.totalIncidents} total incidents`}
            </p>
          </div>
          <Link
            to="/deploy"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold
              rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/20"
          >
            <Rocket size={16} />
            Deploy New
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Status bar */}
        <div className={`${sc.bg} border border-gray-200 rounded-2xl p-4 mb-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${sc.dot} ${overallStatus === 'healthy' ? 'animate-pulse' : ''}`} />
            <span className={`text-sm font-bold ${sc.text}`}>{sc.label}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {summary.lastIncidentAt && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                Last incident {new Date(summary.lastIncidentAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Top 3 widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Needs Action */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className={summary.activeCritical > 0 ? 'text-red-600' : 'text-gray-400'} />
                <h3 className="text-sm font-bold text-gray-900">Needs Action</h3>
              </div>
              {needsAttention.length > 0 && (
                <Link to="/incidents" className="text-xs text-indigo-600 hover:underline font-semibold">
                  View all
                </Link>
              )}
            </div>

            {needsAttention.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500">All clear — no active incidents</p>
              </div>
            ) : (
              <div className="space-y-2">
                {needsAttention.slice(0, 3).map((inc) => (
                  <Link
                    key={inc._id}
                    to={`/incidents/${inc._id}`}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      inc.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{inc.title}</p>
                      <p className="text-[10px] text-gray-500">{inc.projectName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
              </div>
            </div>

            {activity.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {activity.slice(0, 4).map((a, i) => (
                  <Link
                    key={i}
                    to={a.link}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[10px] text-gray-400 mt-0.5 flex-shrink-0 font-mono">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{a.title}</p>
                      <p className="text-[10px] text-gray-500">{a.meta?.projectName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Cost */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-900">Cost Today</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">
                ${cost.today.toFixed(2)}
              </span>
              <span className="text-xs text-gray-500">{cost.currency}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Estimated from incident impact
            </p>
          </div>
        </div>

        {/* Project Health Grid */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Project Health</h3>
            <Link
              to="/projects"
              className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No projects yet</p>
              <Link
                to="/deploy"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
              >
                <Rocket size={12} />
                Deploy First Project
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((p) => {
                const pStatus = {
                  healthy: { dot: 'bg-emerald-500', label: 'Healthy', text: 'text-emerald-600' },
                  warning: { dot: 'bg-amber-500', label: 'Warning', text: 'text-amber-600' },
                  critical: { dot: 'bg-red-500', label: 'Critical', text: 'text-red-600' },
                }[p.status] || { dot: 'bg-gray-400', label: 'Unknown', text: 'text-gray-500' };

                return (
                  <Link
                    key={p._id}
                    to={`/projects/${p._id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${pStatus.dot} flex-shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {p.githubRepo || p.vercelProjectName || 'No integration'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs flex-shrink-0">
                      <span className={`font-semibold ${pStatus.text}`}>{pStatus.label}</span>
                      {p.activeIncidents > 0 && (
                        <span className="text-red-600 font-bold">
                          {p.activeIncidents} active
                        </span>
                      )}
                      <span className="text-gray-400 font-mono">
                        {p.recentIncidents24h} / 24h
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Metrics */}
        {primaryProject && (
          <div className="mb-8">
            <LiveMetricsPanel projectId={primaryProject._id} />
          </div>
        )}

        {/* Charts */}
        {primaryProject && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <LatencyChart />
            <CpuChart />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;