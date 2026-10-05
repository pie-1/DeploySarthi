import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { publicService } from '../../services/publicService';
import { useAuth } from '../../hooks/useAuth';

const CommentSection = ({ projectId, commentCount }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState('');

  const fetchComments = async () => {
    try {
      const res = await publicService.listComments(projectId);
      setComments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || posting) return;

    setPosting(true);
    try {
      const res = await publicService.addComment(projectId, content.trim());
      setComments((prev) => [res.data, ...prev]);
      setContent('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await publicService.deleteComment(id);
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-5">
        Comments {commentCount > 0 && <span className="text-gray-400">({commentCount})</span>}
      </h3>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts or ask a question..."
                rows={2}
                maxLength={1000}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  resize-none placeholder:text-gray-400"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!content.trim() || posting}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold
                    bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors
                    disabled:opacity-50"
                >
                  {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Post
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 text-center">
          <a href="/login" className="text-indigo-600 font-semibold hover:underline">
            Log in
          </a>{' '}
          to leave a comment
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {comments.map((c) => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 group"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                  {c.author?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {c.author?.name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {c.content}
                  </p>
                </div>
                {user && user._id === c.author?._id && (
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg
                      hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CommentSection;