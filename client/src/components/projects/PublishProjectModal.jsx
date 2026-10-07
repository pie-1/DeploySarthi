import { useState, useEffect } from 'react';
import { X, Globe, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { projectService } from '../../services/projectService';

const PublishProjectModal = ({ open, onClose, project, onPublished }) => {
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isCurrentlyPublic = project?.isPublic === true;

  useEffect(() => {
    if (open && project) {
      setDescription(project.publishedDescription || project.description || '');
      setTags(project.tags || []);
      setTagInput('');
      setError('');
    }
  }, [open, project]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!t) return;
    if (tags.includes(t)) {
      setTagInput('');
      return;
    }
    if (tags.length >= 5) {
      setError('Maximum 5 tags');
      return;
    }
    setTags([...tags, t]);
    setTagInput('');
    setError('');
  };

  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

  const handlePublish = async () => {
    if (!description.trim()) {
      setError('Add a public description before publishing');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await projectService.updateVisibility(project._id, {
        isPublic: true,
        publishedDescription: description.trim(),
        tags,
      });
      toast.success('Project published to gallery');
      onPublished?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to publish';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Remove this project from the public gallery?')) return;
    setSaving(true);
    try {
      await projectService.updateVisibility(project._id, {
        isPublic: false,
      });
      toast.success('Project removed from gallery');
      onPublished?.();
      onClose();
    } catch (err) {
      toast.error('Failed to unpublish');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Globe size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isCurrentlyPublic ? 'Project Settings' : 'Publish to Gallery'}
              </h2>
              <p className="text-xs text-gray-500">
                {project.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-2">
            <Globe size={14} className="text-indigo-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-900">
              Publishing makes this project visible in the public gallery. Other developers can
              view, like, and comment on it.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
              Public Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="What does this project do? What did you learn building it?"
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {description.length}/500
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
              Tags (max 5)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md"
                >
                  #{t}
                  <button
                    onClick={() => removeTag(t)}
                    className="hover:text-indigo-900"
                    type="button"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag and press Enter"
                maxLength={20}
                className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 5}
                className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-lg
                  hover:bg-gray-200 disabled:opacity-50"
                type="button"
              >
                Add
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
              <AlertCircle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {isCurrentlyPublic && (
              <button
                onClick={handleUnpublish}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600
                  bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50"
              >
                <EyeOff size={14} />
                Unpublish
              </button>
            )}
            <button
              onClick={handlePublish}
              disabled={saving || !description.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold
                bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
              {isCurrentlyPublic ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishProjectModal;