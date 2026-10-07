import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Log to localStorage so it survives redirect
  try {
    const log = JSON.parse(localStorage.getItem('_debug_pr') || '[]');
    log.push({
      t: new Date().toISOString(),
      path: location.pathname,
      hasUser: !!user,
      userId: user?._id || null,
      loading,
      hasToken: !!localStorage.getItem('token'),
      hasStoredUser: !!localStorage.getItem('deploysarthi_user'),
    });
    localStorage.setItem('_debug_pr', JSON.stringify(log.slice(-20)));
  } catch {}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;