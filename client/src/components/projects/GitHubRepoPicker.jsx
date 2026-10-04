import { useState, useEffect, useMemo } from 'react';
import { Search, Lock, Star } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { githubService } from '../../services/githubService';

const LANGUAGE_COLORS = {
  JavaScript: 'bg-yellow-400',
  TypeScript: 'bg-blue-500',
  Python: 'bg-blue-600',
  HTML: 'bg-orange-500',
  CSS: 'bg-purple-500',
  Java: 'bg-red-500',
  Go: 'bg-cyan-500',
  Rust: 'bg-orange-600',
  PHP: 'bg-indigo-500',
  Ruby: 'bg-red-600',
};

const GitHubRepoPicker = ({ selectedRepo, onSelect }) => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await githubService.listRepos(50);
        setRepos(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load repositories');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return repos;
    const q = search.toLowerCase();
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [repos, search]);

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

  if (repos.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg">
        <FaGithub size={32} className="text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No repositories found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search repositories..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="max-h-72 overflow-y-auto space-y-1.5 border border-gray-200 rounded-lg p-2 bg-gray-50">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            No repos match "{search}"
          </p>
        ) : (
          filtered.map((repo) => {
            const isSelected = selectedRepo?.fullName === repo.fullName;
            const langColor = LANGUAGE_COLORS[repo.language] || 'bg-gray-400';

            return (
              <button
                key={repo.id}
                type="button"
                onClick={() => onSelect(repo)}
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
                        {repo.name}
                      </span>
                      {repo.isPrivate && (
                        <Lock size={11} className="text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${langColor}`} />
                          {repo.language}
                        </span>
                      )}
                      {repo.stars > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star size={10} />
                          {repo.stars}
                        </span>
                      )}
                      <span className="text-gray-400">
                        {new Date(repo.updatedAt).toLocaleDateString()}
                      </span>
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

export default GitHubRepoPicker;