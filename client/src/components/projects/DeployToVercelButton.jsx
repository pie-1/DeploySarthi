import { useState } from 'react';
import { Loader2, Rocket, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../services/api';

const DeployToVercelButton = ({ projectName, gitRepo, framework, onDeployed }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleDeploy = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/vercel/auto-deploy', {
        name: projectName.replace(/[^a-z0-9-]/gi, '-').toLowerCase(),
        gitRepo,
        framework,
      });

      setResult(res.data.data);
      if (onDeployed) onDeployed(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Deployment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {!result && !loading && (
        <button
          onClick={handleDeploy}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5
            bg-black text-white rounded-lg text-sm font-semibold
            hover:bg-gray-800 transition-colors"
        >
          <Rocket size={14} />
          Auto-deploy to Vercel
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Loader2 size={16} className="animate-spin text-indigo-600" />
          <div>
            <p className="text-sm text-gray-700 font-medium">Creating project...</p>
            <p className="text-xs text-gray-500">
              This takes 10-20 seconds
            </p>
          </div>
        </div>
      )}

      {result && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-900">
                Deployment started
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {result.vercelProjectName} · {result.deploymentState}
              </p>
              {result.vercelUrl && (
                <a
                  href={`https://${result.vercelUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-700
                    hover:text-emerald-900 font-medium mt-2 underline"
                >
                  {result.vercelUrl}
                  <ExternalLink size={11} />
                </a>
              )}
              <p className="text-[10px] text-emerald-600 mt-1">
                Vercel will notify on completion. Refresh to see status.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <XCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Deployment failed</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeployToVercelButton;