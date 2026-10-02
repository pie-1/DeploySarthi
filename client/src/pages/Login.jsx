import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Logo from '../components/Logo';

const authImages = [
  { src: '/images/auth-1.png', caption: 'Deploy in seconds, not hours.' },
  { src: '/images/auth-2.png', caption: 'AI explains what broke.' },
  { src: '/images/auth-3.png', caption: 'Sleep better at night.' },
];

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleBtnRef = useRef(null);
  const googleInitialized = useRef(false);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  useEffect(() => {
      console.log('=== Google OAuth Check ===');
      console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
      console.log('Script loaded:', typeof window.google);
      console.log('Container exists:', !!googleBtnRef.current);
    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % authImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle Google callback
  const handleGoogleResponse = async (response) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google button ONCE
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (googleInitialized.current) return; // Guard against StrictMode double-mount

    const initGoogle = () => {
      if (!window.google || !googleBtnRef.current) return;

      // Calculate width in pixels (Google requires pixels, not %)
      const containerWidth = googleBtnRef.current.offsetWidth || 320;
      const buttonWidth = Math.min(Math.max(containerWidth, 200), 400);

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: buttonWidth,
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });

      googleInitialized.current = true;
    };

    // Load Google script
    if (!document.getElementById('google-identity')) {
      const script = document.createElement('script');
      script.id = 'google-identity';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    } else {
      // Script already loaded, init after a tick to ensure container has width
      setTimeout(initGoogle, 100);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#fafafa]">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex justify-center mb-8">
            <Logo size={40} />
          </Link>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Sign in to DeploySarthi</h1>
              <p className="text-sm text-gray-500 mt-2">
                Welcome back! Please sign in to continue.
              </p>
            </div>

            {/* Google button container */}
            <div
              ref={googleBtnRef}
              className="w-full mb-4 flex justify-center"
              style={{ minHeight: '44px' }}
            />

            {!GOOGLE_CLIENT_ID && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-4">
                Google OAuth not configured. Add VITE_GOOGLE_CLIENT_ID to .env
              </p>
            )}

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white border border-gray-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white
                  rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors
                  disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Continue'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Rotating images */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600">
        {authImages.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === imageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={img.src}
              alt={img.caption}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        ))}

        <div className="absolute bottom-12 left-12 right-12 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-4 inline-block">
            <p className="text-lg font-medium text-gray-900">
              {authImages[imageIndex].caption}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;