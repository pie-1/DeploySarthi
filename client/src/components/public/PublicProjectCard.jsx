import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, MessageCircle, ExternalLink } from 'lucide-react';

const PublicProjectCard = ({ project, index = 0 }) => {
  const vercelUrl =
    project.vercelUrl ||
    (project.vercelProjectName ? `${project.vercelProjectName}.vercel.app` : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div
        className="bg-white border border-gray-200 rounded-2xl overflow-hidden
          hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all h-full flex flex-col"
      >
        {/* Preview area */}
        <Link to={`/gallery/${project._id}`} className="block">
          <div className="aspect-video bg-gradient-to-br from-indigo-50 to-violet-50
            flex items-center justify-center relative overflow-hidden">
            {vercelUrl ? (
              <div className="text-center p-4">
                <span className="text-black font-bold text-4xl">▲</span>
                <p className="text-xs text-gray-600 mt-2 font-mono truncate max-w-[200px]">
                  {vercelUrl}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-gray-400 text-3xl">📦</span>
                <p className="text-xs text-gray-500 mt-2">No live URL</p>
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <Link to={`/gallery/${project._id}`} className="block mb-2">
            <h3 className="font-bold text-gray-900 line-clamp-1 hover:text-indigo-600 transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[32px]">
              {project.publishedDescription || project.description || 'No description'}
            </p>
          </Link>

          {/* Author */}
          <div className="flex items-center gap-2 mb-3 mt-auto">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
              {project.owner?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-xs text-gray-600 truncate">
              {project.owner?.name || 'Anonymous'}
            </span>
          </div>

          {/* Tech tags */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {project.githubLanguage && (
              <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-semibold text-gray-600">
                {project.githubLanguage}
              </span>
            )}
            {project.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-indigo-50 rounded text-[10px] font-semibold text-indigo-600"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Heart size={11} className="fill-red-500 text-red-500" />
                {project.likeCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={11} />
                {project.commentCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {project.views || 0}
              </span>
            </div>
            {vercelUrl && (
              <a
                href={`https://${vercelUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Live <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PublicProjectCard;