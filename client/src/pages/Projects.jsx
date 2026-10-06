import { useState, useEffect, useMemo } from 'react';
import { Plus, Server, Search, Lock, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { projectService } from '../services/projectService';
import { publicService } from '../services/publicService';
import ProjectCard from '../components/projects/ProjectCard';
import PublicProjectCard from '../components/public/PublicProjectCard';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';
import { CATEGORIES } from '../utils/categories';

const Projects = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState(user ? 'my' : 'public');
  const [myProjects, setMyProjects] = useState([]);
  const [publicProjects, setPublicProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [publishingId, setPublishingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const publicRes = await publicService.listProjects({ limit: 50 });
      setPublicProjects(publicRes.data || []);

      if (user) {
        const myRes = await projectService.getAll();
        setMyProjects(myRes.data || []);
      }
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await projectService.remove(id);
      setMyProjects((prev) => prev.filter((p) => p._id !== id));
      setPublicProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  const handleTogglePublish = async (project) => {
    setPublishingId(project._id);
    try {
      const res = await projectService.updateVisibility(project._id, {
        isPublic: !project.isPublic,
        publishedDescription: project.description,
      });

      // Update local state
      setMyProjects((prev) =>
        prev.map((p) =>
          p._id === project._id ? { ...p, isPublic: res.data.isPublic } : p
        )
      );

      // Refresh public list
      const publicRes = await publicService.listProjects({ limit: 50 });
      setPublicProjects(publicRes.data || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update visibility');
    } finally {
      setPublishingId(null);
    }
  };

  const handleCreated = (newProject) => {
    setMyProjects((prev) => [newProject, ...prev]);
  };

  const source = mode === 'my' ? myProjects : publicProjects;

  const visible = useMemo(() => {
    let list = [...source];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.publishedDescription?.toLowerCase().includes(q) ||
          p.githubRepo?.toLowerCase().includes(q)
      );
    }
    if (category !== 'all') {
      list = list.filter((p) => p.category === category);
    }
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [source, search, category]);

  const counts = useMemo(() => ({
    my: myProjects.length,
    public: publicProjects.length,
  }), [myProjects, publicProjects]);

  return (
    <div className="pb-16 px-6">
      <div className="max-w-7xl mx-auto pt-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Projects</h1>
            <p className="text-sm text-gray-600 mt-1.5">
              {mode === 'my'
                ? 'Manage your projects'
                : 'Discover what developers are building'}
            </p>
          </div>
          {user && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold
                rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/20"
            >
              <Plus size={16} />
              New Project
            </button>
          )}
        </div>

        {user && (
          <div className="mb-6 inline-flex p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setMode('my')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                transition-colors ${mode === 'my' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Lock size={14} />
              My Projects
              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">{counts.my}</span>
            </button>
            <button
              onClick={() => setMode('public')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                transition-colors ${mode === 'public' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Globe size={14} />
              Public
              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">{counts.public}</span>
            </button>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                focus:bg-white transition-colors placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                  rounded-lg whitespace-nowrap transition-colors ${
                    category === cat.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-white border border-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Server size={26} className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {mode === 'my' ? 'No projects yet' : 'No public projects found'}
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              {mode === 'my'
                ? 'Create your first project to start monitoring.'
                : 'No public projects match your filters.'}
            </p>
            {mode === 'my' && (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                  bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} />
                Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((p, i) =>
              mode === 'my' ? (
                <ProjectCard
                  key={p._id}
                  project={p}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                  index={i}
                />
              ) : (
                <PublicProjectCard key={p._id} project={p} index={i} />
              )
            )}
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