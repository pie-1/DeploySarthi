import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, RocketIcon, Triangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DeploymentStats from '../components/deploy/DeploymentStats';
import DeploymentCard from '../components/deploy/DeploymentCard';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';

const Deploy = () => {
  const [deployments, setDeployments] = useState([]);
  const [vercelProjects, setVercelProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const vercelRes = await api.get('/vercel/projects?limit=50');
      const vProjects = vercelRes.data.data || [];
      setVercelProjects(vProjects);

      const results = await Promise.all(
        vProjects.map((vp) =>
          api.get(`/vercel/projects/${vp.id}/deployments?limit=5`)
            .then((r) => (r.data.data || []).map((d) => ({
              ...d,
              projectId: vp.id,
              vercelProjectName: vp.name,
            })))
            .catch(() => [])
        )
      );

      const allDeployments = results.flat().sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setDeployments(allDeployments);
    } catch (err) {
      setError('Failed to load deployments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreated = (newProject) => {
    setDeployModalOpen(false);
    fetchData();
    if (newProject?._id) {
      navigate(`/projects/${newProject._id}`);
    }
  };

  const filtered = filter === 'all'
    ? deployments
    : deployments.filter((d) => d.vercelProjectName === filter);

  return (
    <div className="pb-16 px-6">
      <div className="max-w-7xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Deploy</h1>
            <p className="text-sm text-gray-600 mt-1.5">
              Deploy from GitHub · monitor builds · debug failures with AI
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setDeployModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold
                rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <RocketIcon size={16} />
              Deploy New
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && deployments.length > 0 && (
          <DeploymentStats deployments={deployments} />
        )}

        {!loading && vercelProjects.length > 0 && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All ({deployments.length})
            </button>
            {vercelProjects.map((vp) => {
              const count = deployments.filter((d) => d.vercelProjectName === vp.name).length;
              return (
                <button
                  key={vp.id}
                  onClick={() => setFilter(vp.name)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    filter === vp.name
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {vp.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white border border-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : deployments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Triangle size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No deployments yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Deploy a GitHub repository to Vercel and DeploySarthi will monitor it automatically.
            </p>
            <button
              onClick={() => setDeployModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <RocketIcon size={16} />
              Deploy your first project
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <p className="text-sm text-gray-500">No deployments for this project.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => (
              <DeploymentCard
                key={d.id}
                deployment={d}
                projectName={d.vercelProjectName}
                onRedeployed={fetchData}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
};

export default Deploy;