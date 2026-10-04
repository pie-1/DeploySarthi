import { Link } from 'react-router-dom';
import {
  Mail, Phone, Calendar, Folder, Activity, Server,
  Zap, TrendingUp, Settings, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Logo from '../components/Logo';

const Profile = () => {
  const { user, logout } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  const stats = [
    { label: 'Projects', value: '0', icon: Folder, color: 'text-indigo-600' },
    { label: 'Incidents Resolved', value: '0', icon: Activity, color: 'text-emerald-600' },
    { label: 'Services Connected', value: '0', icon: Server, color: 'text-violet-600' },
    { label: 'Uptime', value: '—', icon: TrendingUp, color: 'text-blue-600' },
  ];

  const menuItems = [
    { label: 'Settings', desc: 'Manage your account preferences', icon: Settings, to: '/settings' },
    { label: 'Connected Services', desc: 'AWS, Vercel, Supabase', icon: Server, to: '/services' },
    { label: 'Notifications', desc: 'WhatsApp, Email alerts', icon: Zap, to: '/notifications' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>

        {/* User Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-600 text-white
                  flex items-center justify-center text-2xl font-bold">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} />
                  {user?.email}
                </span>
                {user?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} />
                    {user.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  Joined {joinedDate}
                </span>
              </div>
            </div>

            <Link
              to="/settings"
              className="px-4 py-2 text-sm font-semibold text-gray-800
                border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <stat.icon size={18} className={stat.color} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
          {menuItems.map((item, i) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
                i !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <item.icon size={18} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-red-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Once you log out, you'll need to sign in again to access your account.
          </p>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white
              rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            <LogOut size={15} />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;