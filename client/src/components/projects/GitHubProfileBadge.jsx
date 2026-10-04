import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { githubService } from '../../services/githubService';

const GitHubProfileBadge = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await githubService.getProfile();
        if (!cancelled) setProfile(res.data);
      } catch (err) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <FaGithub size={16} />
        Checking GitHub connection...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <XCircle size={16} className="text-red-500" />
        GitHub not connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
      <img
        src={profile.avatar}
        alt={profile.login}
        className="w-8 h-8 rounded-full border border-emerald-300"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-emerald-900 truncate">
          {profile.name || profile.login}
        </p>
        <p className="text-xs text-emerald-700">@{profile.login}</p>
      </div>
      <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
    </div>
  );
};

export default GitHubProfileBadge;