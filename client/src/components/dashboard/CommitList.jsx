import { useState, useEffect } from 'react';
import { GitCommit, ExternalLink } from 'lucide-react';
import { githubService } from '../../services/githubService';

const CommitList = ({ repoFullName, limit = 10 }) => {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!repoFullName) return;
    let cancelled = false;

    (async () => {
      try {
        const [owner, repo] = repoFullName.split('/');
        const res = await githubService.listCommits(owner, repo, limit);
        if (!cancelled) setCommits(res.data || []);
      } catch (err) {
        if (!cancelled) setError('Failed to load commits');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [repoFullName, limit]);

  if (!repoFullName) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Commits</h3>
        <p className="text-sm text-gray-500">
          No GitHub repository connected to this project.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Recent Commits</h3>
        <a
          href={`https://github.com/${repoFullName}/commits`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1"
        >
          View on GitHub <ExternalLink size={11} />
        </a>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : commits.length === 0 ? (
        <p className="text-sm text-gray-500">No commits found.</p>
      ) : (
        <div className="space-y-1">
          {commits.map((commit) => (
            <a
              key={commit.sha}
              href={commit.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <GitCommit size={14} className="text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 line-clamp-1">{commit.message}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                    {commit.shortSha}
                  </span>
                  <span>{commit.author}</span>
                  <span className="text-gray-300">·</span>
                  <span>{new Date(commit.date).toLocaleString()}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommitList;