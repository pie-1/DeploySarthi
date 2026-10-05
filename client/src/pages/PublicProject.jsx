import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, Eye, MessageCircle, Calendar, User,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { publicService } from '../services/publicService';
import LikeButton from '../components/public/LikeButton';
import CommentSection from '../components/public/CommentSection';

const PublicProject = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await publicService.getProject(id);
        setProject(res.data);
      } catch (err) {
        setError('Project not found or not public');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] pt-20 px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-10 w-40 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-64 bg-white border border-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#fafafa] pt-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={16} />
            Back to Gallery
          </Link>
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{error}</h2>
            <p className="text-sm text-gray-500">
              This project may have been made private or removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const vercelUrl = project.vercelUrl
    || (project.vercelProjectName ? `${project.vercelProjectName}.vercel.app` : null);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="pt-20 px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={16} />
            Back to Gallery
          </Link>

          {/* Header card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {project.publishedDescription || project.description || 'No description'}
                </p>
              </div>
              <LikeButton
                projectId={project._id}
                initialLiked={project.isLiked}
                initialCount={project.likeCount || 0}
              />
            </div>

            {/* Author + meta */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 pb-5 border-b border-gray-100">
              <span className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600">
                  {project.owner?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                {project.owner?.name || 'Anonymous'}
              </span>
              {project.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  Published {new Date(project.publishedAt).toLocaleDateString()}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {project.views || 0} views
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={11} />
                {project.commentCount || 0} comments
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-2 pt-5">
              {vercelUrl && (
                <a
                  href={`https://${vercelUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white
                    rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  <span className="font-bold">▲</span>
                  Visit live
                  <ExternalLink size={12} />
                </a>
              )}
              {project.githubRepo && (
                <a
                  href={`https://github.com/${project.githubRepo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200
                    rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  <FaGithub size={14} />
                  View source
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Tags */}
            {(project.githubLanguage || project.tags?.length > 0) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-4">
                {project.githubLanguage && (
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                    {project.githubLanguage}
                  </span>
                )}
                {project.tags?.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-indigo-50 rounded text-[10px] font-semibold text-indigo-600">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Live preview */}
          {vercelUrl && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Live Preview
                </span>
                <span className="text-[10px] text-gray-400 font-mono">{vercelUrl}</span>
              </div>
              <iframe
                src={`https://${vercelUrl}`}
                title={project.name}
                className="w-full h-96 bg-gray-50"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          )}

          {/* Comments */}
          <CommentSection projectId={project._id} commentCount={project.commentCount || 0} />
        </div>
      </div>
    </div>
  );
};

export default PublicProject;