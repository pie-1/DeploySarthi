import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Server, ArrowUpRight, ExternalLink, Lock, Trash2, Clock, Globe,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { getCategoryEmoji } from '../../utils/categories';

const STATUS_STYLES = {
  healthy: { dot: 'bg-emerald-500', label: 'Healthy', text: 'text-emerald-700' },
  warning: { dot: 'bg-amber-500', label: 'Warning', text: 'text-amber-700' },
  critical: { dot: 'bg-red-500', label: 'Critical', text: 'text-red-700' },
  unknown: { dot: 'bg-gray-400', label: 'Not connected', text: 'text-gray-600' },
};

const ProjectCard = ({ project, onDelete, onTogglePublish, index = 0 }) => {
  const status = STATUS_STYLES[project.status] || STATUS_STYLES.unknown;
  const hasGithub = !!project.githubRepo;
  const hasVercel = !!project.vercelProjectId;
  const isPublic = project.isPublic === true;
  const canPublish = hasVercel; // Only deployed projects can be published

  const vercelUrl =
    project.vercelUrl ||
    (project.vercelProjectName ? `${project.vercelProjectName}.vercel.app` : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group"
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-5
        hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all h-full flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Server size={17} className="text-indigo-600" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${status.dot}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wide ${status.text}`}>
                {status.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Publish toggle */}
            {canPublish && onTogglePublish && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTogglePublish(project);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isPublic
                    ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                    : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
                title={isPublic ? 'Published — click to unpublish' : 'Publish to gallery'}
              >
                <Globe size={14} />
              </button>
            )}

            {/* Delete */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(project._id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg
                  hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
                title="Delete project"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Title + Description */}
        <Link to={`/projects/${project._id}`} className="block mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            {project.category && (
              <span className="text-[10px]">{getCategoryEmoji(project.category)}</span>
            )}
            <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors
              line-clamp-1 text-base">
              {project.name}
            </h3>
            {isPublic && (
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded">
                LIVE
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[32px]">
            {project.description || 'No description'}
          </p>
        </Link>

        {/* Env / Target tags */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase tracking-wide">
            {project.environment}
          </span>
          <span className="px-2 py-0.5 bg-indigo-50 rounded text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
            {project.deploymentTarget}
          </span>
          {project.githubLanguage && (
            <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase tracking-wide">
              {project.githubLanguage}
            </span>
          )}
        </div>

        {/* Integrations */}
        <div className="mt-auto pt-3 border-t border-gray-100 space-y-1.5">
          {hasGithub && (
            <a
              href={`https://github.com/${project.githubRepo}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaGithub size={11} className="flex-shrink-0" />
              <span className="truncate">{project.githubRepo}</span>
              {project.githubIsPrivate && <Lock size={9} className="flex-shrink-0" />}
              <ExternalLink size={9} className="flex-shrink-0 opacity-50" />
            </a>
          )}

          {hasVercel && vercelUrl && (
            <a
              href={`https://${vercelUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="text-black font-bold text-[11px] flex-shrink-0">▲</span>
              <span className="truncate">{vercelUrl}</span>
              <ExternalLink size={9} className="flex-shrink-0 opacity-50" />
            </a>
          )}

          {!hasGithub && !hasVercel && (
            <p className="text-xs text-gray-400 italic">
              No integrations linked yet
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock size={9} />
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
          <Link
            to={`/projects/${project._id}`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700
              flex items-center gap-1 transition-colors"
          >
            Open <ArrowUpRight size={11} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;