import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { publicService } from '../services/publicService';
import PublicProjectCard from '../components/public/PublicProjectCard';

const SORTS = [
  { value: 'recent', label: 'Recent', icon: Clock },
  { value: 'popular', label: 'Popular', icon: TrendingUp },
  { value: 'name', label: 'A → Z' },
];

const PublicGallery = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [pagination, setPagination] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await publicService.listProjects({
        search,
        sort,
        page: 1,
        limit: 24,
      });
      setProjects(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, sort]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold mb-5">
            <Sparkles size={12} />
            Public Gallery
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Discover what developers are building
          </h1>
          <p className="text-lg text-indigo-100 max-w-xl mx-auto">
            Real projects, deployed through DeploySarthi. Browse, explore, and get inspired.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                focus:bg-white transition-colors placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-1">
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold
                  rounded-lg transition-colors whitespace-nowrap ${
                    sort === s.value
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {s.icon && <s.icon size={12} />}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-white border border-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <Sparkles size={40} className="text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No public projects yet</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Be the first to showcase your project! Deploy something and mark it public.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((p, i) => (
                <PublicProjectCard key={p._id} project={p} index={i} />
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="text-center mt-10">
                <p className="text-sm text-gray-500">
                  Showing {projects.length} of {pagination.total} projects
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PublicGallery;