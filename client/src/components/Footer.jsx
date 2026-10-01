import { Link } from 'react-router-dom';
import { FaGithub, FaTwitter } from 'react-icons/fa';
import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <Link to="/">
            <Logo size={28} />
          </Link>

          <div className="flex items-center gap-8 text-sm text-gray-600">
            <Link to="/docs" className="hover:text-gray-900 transition-colors">Docs</Link>
            <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="https://github.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-900 transition-colors"
              aria-label="GitHub"
            >
              <FaGithub size={20} />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-900 transition-colors"
              aria-label="Twitter"
            >
              <FaTwitter size={20} />
            </a>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          © 2026 DeploySarthi. Built for developers.
        </p>
      </div>
    </footer>
  );
};

export default Footer;