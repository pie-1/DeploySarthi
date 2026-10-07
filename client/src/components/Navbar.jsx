import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search, Star } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import Logo from './Logo';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [starCount, setStarCount] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch real GitHub star count
  useEffect(() => {
    const fetchStars = async () => {
      try {
        const res = await fetch('https://api.github.com/repos/pie-1/DeploySarthi');
        if (!res.ok) return;
        const data = await res.json();
        setStarCount(data.stargazers_count);
      } catch {
        // silently fail
      }
    };
    fetchStars();
  }, []);

  const publicLinks = [
    { label: 'Projects', to: '/projects' },
    { label: 'Docs', to: '/docs' },
  ];

  const privateLinks = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Projects', to: '/projects' },
    { label: 'Deploy', to: '/deploy' },
    { label: 'Incidents', to: '/incidents' },
    { label: 'AI Investigation', to: '/ai' },
  ];

  const navLinks = user ? privateLinks : publicLinks;

  return (
    <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-200' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link to="/" className="flex-shrink-0">
          <Logo size={32} />
        </Link>

        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="px-3.5 py-2 text-[14px] font-semibold text-gray-700
                hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}

          <div className="relative ml-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-72 pl-10 pr-4 py-2.5 text-[13px] font-medium bg-gray-50
                border border-gray-200 rounded-lg focus:outline-none focus:ring-2
                focus:ring-indigo-500 focus:border-transparent focus:w-80
                focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-normal"
            />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {/* Give Star — GitHub */}
          <a
            href="https://github.com/pie-1/DeploySarthi"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-3 py-2 text-[13px] font-semibold
              text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50
              border border-gray-200 hover:border-gray-300 rounded-lg transition-all"
          >
            <FaGithub size={16} className="text-gray-900" />
            <span>Star</span>
            {starCount !== null && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50
                border border-amber-200 rounded text-[11px] font-mono text-amber-700">
                <Star size={9} className="fill-amber-500 text-amber-500" />
                {starCount}
              </span>
            )}
          </a>

          {user ? (
            <ProfileDropdown />
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-[13px] font-semibold text-gray-800
                  border border-gray-200 rounded-lg hover:bg-gray-50
                  hover:border-gray-300 transition-all"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-[13px] font-bold bg-indigo-600 text-white
                  rounded-lg hover:bg-indigo-700 transition-colors shadow-sm
                  shadow-indigo-500/20"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-6 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="block px-3 py-2.5 text-[14px] font-semibold text-gray-700
                hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* GitHub link on mobile */}
          <a
            href="https://github.com/pie-1/DeploySarthi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-[14px]
              font-semibold text-gray-800 border border-gray-200 rounded-lg
              hover:bg-gray-50 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <FaGithub size={16} />
            <span>Star on GitHub</span>
            {starCount !== null && (
              <span className="text-[12px] font-mono text-amber-600">· {starCount}</span>
            )}
          </a>

          <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block px-3 py-2.5 text-center text-[14px] font-semibold
                    text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="block w-full px-3 py-2.5 text-center text-[14px] font-bold
                    bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2.5 text-center text-[14px] font-semibold
                    text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2.5 text-center text-[14px] font-bold
                    bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;