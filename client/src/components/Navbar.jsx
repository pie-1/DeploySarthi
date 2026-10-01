import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import Logo from './Logo';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const navLinks = [
    { label: 'Deploy', to: '/deploy' },
    { label: 'Monitor', to: '/monitor' },
    { label: 'Incidents', to: '/incidents' },
    { label: 'AI Investigation', to: '/ai' },
    { label: 'Docs', to: '/docs' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-200' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
                
        <Link to="/" className="flex-shrink-0">
          <Logo size={32} />
        </Link>

        {/* Center: Nav Links + Search */}
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 
                hover:bg-gray-50 rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Search Bar */}
          <div className="relative ml-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-40 pl-9 pr-12 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                focus:w-56 transition-all placeholder:text-gray-400"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 
              bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 
              hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <FaGithub size={15} />
            <span>2.1k</span>
          </a>

          <Link 
            to="/login" 
            className="px-3.5 py-2 text-sm text-gray-700 border border-gray-200 
              rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Log in
          </Link>

          <Link 
            to="/signup" 
            className="px-3.5 py-2 text-sm bg-indigo-600 text-white rounded-lg 
              hover:bg-indigo-700 transition-colors font-medium"
          >
            Get Demo
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors" 
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-6 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="block px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
            <Link 
              to="/login" 
              className="block px-3 py-2.5 text-center text-gray-700 border border-gray-200 
                rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Log in
            </Link>
            <Link 
              to="/signup" 
              className="block px-3 py-2.5 text-center bg-indigo-600 text-white 
                rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Get Demo
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;