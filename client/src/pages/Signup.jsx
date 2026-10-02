import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Logo from '../components/Logo';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const googleInitialized = useRef(false);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleGoogleResponse = async (response) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (googleInitialized.current) return;

    const initGoogle = () => {
      if (!window.google || !googleBtnRef.current) return;

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
        text: 'signup_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });

      googleInitialized.current = true;
    };

    if (!document.getElementById('google-identity')) {
      const script = document.createElement('script');
      script.id = 'google-identity';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    } else {
      setTimeout(initGoogle, 100);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-6 py-12 relative">
      <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <Logo size={40} />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-sm text-gray-500 mt-2">
              Welcome! Please fill in the details to get started.
            </p>
          </div>

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
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  placeholder:text-gray-400"
              />
            </div>

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
                  minLength={6}
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
              <p className="text-xs text-gray-500 mt-1.5">
                Must be at least 6 characters
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white
                rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="text-indigo-600 hover:underline">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>
          </p>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;