import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();

  return (
    <div className="pb-16 px-6">
      <div className="max-w-7xl mx-auto pt-8">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Detail</h1>
          <p className="text-sm text-gray-500">
            Project ID: <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{id}</code>
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Full project detail soon
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;