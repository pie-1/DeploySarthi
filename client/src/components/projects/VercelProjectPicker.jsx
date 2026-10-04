import { useState, useEffect, useMemo } from 'react';
import { Search, ExternalLink, Triangle } from 'lucide-react';
import { vercelService } from '../../services/vercelService';

const FRAMEWORK_LABELS = {
  nextjs: 'Next.js',
  vite: 'Vite',
  create_react_app: 'React',
  vue: 'Vue',
  nuxtjs: 'Nuxt',
  svelte: 'Svelte',
  angular: 'Angular',
  remix: 'Remix',
  astro: 'Astro',
  other: 'Other',
};

const VercelProjectPicker = ({ selectedProject, onSelect }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await vercelService.listProjects(50);
        setProjects(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load Vercel projects');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, search]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg">
        <Triangle size={32} className="text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No Vercel projects found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Vercel projects..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto space-y-1.5 border border-gray-200 rounded-lg p-2 bg-gray-50">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            No projects match "{search}"
          </p>
        ) : (
          filtered.map((p) => {
            const isSelected = selectedProject?.id === p.id;
            const framework = FRAMEWORK_LABELS[p.framework] || p.framework || 'Static';

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                    : 'border-transparent bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-gray-900 truncate">
                        {p.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded font-medium">
                        {framework}
                      </span>
                      {p.gitRepo && (
                        <span className="truncate font-mono">{p.gitRepo}</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VercelProjectPicker;