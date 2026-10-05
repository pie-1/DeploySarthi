import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, GitBranch, Star, Lock, ExternalLink,
  Server, AlertTriangle,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { projectService } from '../services/projectService';
import CommitList from '../components/dashboard/CommitList';
import VercelDeployments from '../components/projects/VercelDeployments';
import DeployToVercelButton from '../components/projects/DeployToVercelButton';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProject = async () => {
    try {
      const res = await projectService.getById(id);
      setData(res.data);
    } catch (err) {
      setError('Project not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleDeployed = (deployResult) => {
    // Update project locally with new Vercel info
    setData((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        vercelProjectId: deployResult.vercelProjectId,
        vercelProjectName: deployResult.vercelProjectName,
        vercelUrl: deployResult.vercelUrl,
      },
    }));
  };

  if (loading) {
    return (
      <div className="pb-16 px-6">
        <div className="max-w-5xl mx-auto pt-8">
          <div className="h-8 w-40 bg-gray-100 rounded-lg animate-pulse mb-6" />
          <div className="h-40 bg-white border border-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pb-16 px-6">
        <div className="max-w-5xl mx-auto pt-8">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </Link>
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <AlertTriangle size={40} className="text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Project not found</h2>
          </div>
        </div>
      </div>
    );
  }

  const { project, incidents } = data;

  return (
    <div className="pb-16 px-6">
      <div className="max-w-5xl mx-auto pt-8">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </button>

        {/* Project header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Server size={22} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {project.description || 'No description'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="px-2.5 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                  {project.environment}
                </span>
                <span className="px-2.5 py-1 bg-indigo-50 rounded-md text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                  {project.deploymentTarget}
                </span>
                {project.githubLanguage && (
                  <span className="px-2.5 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                    {project.githubLanguage}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* GitHub link */}
          {project.githubRepo && (
            <div className="pt-5 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                  <FaGithub size={18} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://github.com/${project.githubRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-gray-900 hover:text-indigo-600 flex items-center gap-1"
                    >
                      {project.githubRepo}
                      <ExternalLink size={11} />
                    </a>
                    {project.githubIsPrivate && (
                      <Lock size={11} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <GitBranch size={11} />
                      {project.githubDefaultBranch || 'main'}
                    </span>
                    {project.githubStars > 0 && (
                      <span className="flex items-center gap-1">
                        <Star size={11} />
                        {project.githubStars}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vercel link OR auto-deploy button */}
          <div className="pt-5 border-t border-gray-100 mt-5">
            {project.vercelProjectId ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                  <span className="text-white font-bold text-base">▲</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://${project.vercelUrl || project.vercelProjectName + '.vercel.app'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-gray-900 hover:text-indigo-600 flex items-center gap-1"
                    >
                      {project.vercelUrl || `${project.vercelProjectName}.vercel.app`}
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>Vercel project: {project.vercelProjectName}</span>
                  </div>
                </div>
              </div>
            ) : project.githubRepo ? (
              <div>
                <p className="text-xs text-gray-500 mb-3">
                  Deploy this repository to Vercel to enable deployment monitoring.
                </p>
                <DeployToVercelButton
                  projectName={project.name}
                  gitRepo={project.githubRepo}
                  framework={project.githubLanguage?.toLowerCase()}
                  onDeployed={handleDeployed}
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Real Commits */}
        {project.githubRepo && (
          <div className="mb-6">
            <CommitList repoFullName={project.githubRepo} limit={10} />
          </div>
        )}

        {/* Vercel Deployments */}
        {project.vercelProjectId && (
          <div className="mb-6">
            <VercelDeployments vercelProjectId={project.vercelProjectId} />
          </div>
        )}

        {/* Recent Incidents */}
        {incidents && incidents.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Incidents</h3>
            <div className="space-y-2">
              {incidents.map((incident) => (
                <Link
                  key={incident._id}
                  to={`/incidents/${incident._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{incident.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(incident.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-amber-50 text-amber-700">
                    {incident.severity}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;