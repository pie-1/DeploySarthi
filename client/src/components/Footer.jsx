import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowUpRight } from 'lucide-react';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';

const LINKS = {
  Product: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Projects', to: '/projects' },
    { label: 'Deploy', to: '/deploy' },
    { label: 'Incidents', to: '/incidents' },
    { label: 'AI Investigation', to: '/ai' },
  ],
  Resources: [
    { label: 'Documentation', to: '/docs' },
    { label: 'Pricing', to: '/#pricing' },
    { label: 'Changelog', to: '/#changelog' },
    { label: 'Status', to: '/#status' },
  ],
  Company: [
    { label: 'About', to: '/#about' },
    { label: 'Blog', to: '/#blog' },
    { label: 'Careers', to: '/#careers' },
    { label: 'Contact', to: '/#contact' },
  ],
};

const SOCIALS = [
  { icon: FaGithub, href: 'https://github.com/pie-1/DeploySarthi', label: 'GitHub' },
  { icon: FaTwitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: FaLinkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:hello@deploysarthi.dev', label: 'Email' },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative bg-[#060a14] border-t border-white/[0.06]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Gradient bleed from Features section */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Top: logo + tagline + nav columns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-14">

          {/* Brand block */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                <svg viewBox="0 0 64 64" fill="none" className="w-5 h-5">
                  <path
                    d="M32 8 C32 8, 22 20, 22 36 L22 44 L42 44 L42 36 C42 20, 32 8, 32 8 Z"
                    fill="white"
                  />
                  <circle cx="32" cy="28" r="4" fill="#4f46e5" />
                  <path d="M22 38 L14 46 L22 44 Z" fill="white" />
                  <path d="M42 38 L50 46 L42 44 Z" fill="white" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                DeploySarthi
              </span>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-sm">
              AI-assisted deployment, monitoring, and incident investigation for
              developers and small startups. Ship with confidence — we handle the rest.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2">
              {SOCIALS.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg border border-white/[0.08] bg-white/[0.02]
                      hover:bg-white/[0.06] hover:border-white/[0.15] transition-all
                      flex items-center justify-center group"
                    title={s.label}
                  >
                    <Icon
                      size={15}
                      className="text-gray-500 group-hover:text-gray-300 transition-colors"
                    />
                  </a>
                );
              })}
            </div>
          </motion.div>

          {/* Nav columns */}
          {Object.entries(LINKS).map(([group, items], groupIdx) => (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.06 * (groupIdx + 1) }}
            >
              <h4 className="text-[11.5px] font-bold text-gray-500 uppercase tracking-[0.12em] mb-4">
                {group}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-[13.5px] text-gray-400 hover:text-white
                        transition-colors inline-flex items-center gap-1 group"
                    >
                      {item.label}
                      <ArrowUpRight
                        size={11}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06] pt-6">

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Copyright */}
            <p className="text-[12.5px] text-gray-500 text-center md:text-left">
              © {year} DeploySarthi · Built at Acme Engineering College
            </p>

            {/* Legal links */}
            <div className="flex items-center gap-6">
              <Link
                to="/#privacy"
                className="text-[12.5px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/#terms"
                className="text-[12.5px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/docs"
                className="text-[12.5px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                Docs
              </Link>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[12.5px] text-gray-500">
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;