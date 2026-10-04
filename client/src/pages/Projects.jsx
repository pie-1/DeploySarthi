import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Server, GitBranch, Trash2, ArrowUpRight } from 'lucide-react';
import { projectService } from '../services/projectService';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await projectService.getAll();
      setProjects(res.data || []);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await projectService.remove(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  const handleCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  return (
    <div className="pb-16 px-6">
      <div className="max-w-7xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Projects</h1>
            <p className="text-sm text-gray-600 mt-1.5">
              Manage the projects you monitor with DeploySarthi
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white border border-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Server size={24} className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Create your first project to start monitoring deployments, incidents, and cloud costs.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-6 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl
                hover:bg-indigo-700 transition-colors"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <Link
                key={p._id}
                to={`/projects/${p._id}`}
                className="group bg-white border border-gray-200 rounded-2xl p-5
                  hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Server size={18} className="text-indigo-600" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDelete(p._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg
                        hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
                      title="Delete project"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ArrowUpRight size={14} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-1.5 group-hover:text-indigo-600 transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[32px]">
                  {p.description || 'No description'}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2.5 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                    {p.environment}
                  </span>
                  <span className="px-2.5 py-1 bg-indigo-50 rounded-md text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                    {p.deploymentTarget}
                  </span>
                </div>

                {p.githubRepo && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate pt-3 border-t border-gray-100">
                    <GitBranch size={12} />
                    {p.githubRepo}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
};

export default Projects;