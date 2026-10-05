import { useState } from 'react';
import { Heart } from 'lucide-react';
import { publicService } from '../../services/publicService';
import { useAuth } from '../../hooks/useAuth';

const LikeButton = ({ projectId, initialLiked, initialCount }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user) {
      alert('Please log in to like projects');
      return;
    }

    setLoading(true);
    try {
      const res = await publicService.toggleLike(projectId);
      setLiked(res.data.liked);
      setCount(res.data.likeCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm
        transition-all ${liked
          ? 'bg-red-50 text-red-600 border border-red-200'
          : 'bg-white text-gray-700 border border-gray-200 hover:border-red-300 hover:text-red-600'
        } disabled:opacity-50`}
    >
      <Heart size={16} className={liked ? 'fill-red-500' : ''} />
      {count}
    </button>
  );
};

export default LikeButton;