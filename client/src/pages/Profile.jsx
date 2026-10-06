import { useState, useEffect } from 'react';
import {
  Mail, Phone, Calendar, LogOut, Edit3, X, Check, Shield,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import StatsGrid from '../components/profile/StatsGrid';
import ConnectedAccounts from '../components/profile/ConnectedAccounts';
import NotificationPrefs from '../components/profile/NotificationPrefs';
import ActivityFeed from '../components/profile/ActivityFeed';

const Profile = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profileRes, activityRes] = await Promise.all([
        userService.getProfile(),
        userService.getActivity(10),
      ]);
      setProfile(profileRes.data.user);
      setStats(profileRes.data.stats);
      setActivities(activityRes.data || []);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const startEdit = () => {
    setEditForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const res = await userService.updateProfile(editForm);
      setProfile(res.data);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async (notifications) => {
    const res = await userService.updatePreferences(notifications);
    setProfile(res.data);
  };

  const initials =
    profile?.name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  if (loading) {
    return (
      <div className="pb-16 px-6">
        <div className="max-w-6xl mx-auto pt-8 space-y-6">
          <div className="h-8 w-40 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-48 bg-white border border-gray-200 rounded-2xl animate-pulse" />
          <div className="h-32 bg-white border border-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 px-6">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profile</h1>
          <p className="text-sm text-gray-600 mt-1.5">
            Manage your account and preferences
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — User card + stats + connected + danger */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500
                  text-white flex items-center justify-center text-2xl font-bold mb-3">
                  {initials}
                </div>

                {editing ? (
                  <div className="w-full space-y-3 text-left">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                          })
                        }
                        placeholder="9812345678"
                        maxLength={10}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2
                          bg-indigo-600 text-white text-xs font-semibold rounded-lg
                          hover:bg-indigo-700 transition-colors disabled:opacity-60"
                      >
                        <Check size={12} />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2
                          text-gray-700 text-xs font-semibold rounded-lg border border-gray-200
                          hover:bg-gray-50 transition-colors"
                      >
                        <X size={12} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-900">{profile?.name}</h2>
                    <p className="text-xs text-gray-500 mt-1">Joined {joinedDate}</p>
                  </>
                )}
              </div>

              {!editing && (
                <>
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Mail size={12} className="text-gray-400" />
                      <span className="truncate">{profile?.email}</span>
                    </div>
                    {profile?.phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone size={12} className="text-gray-400" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={startEdit}
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2
                      text-sm font-semibold text-gray-800 border border-gray-200 rounded-lg
                      hover:bg-gray-50 transition-colors"
                  >
                    <Edit3 size={14} />
                    Edit Profile
                  </button>
                </>
              )}
            </div>

            {/* Danger Zone */}
            <div className="bg-white border border-red-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} className="text-red-600" />
                <h3 className="text-xs font-bold text-red-600 uppercase tracking-wide">
                  Danger Zone
                </h3>
              </div>
              <button
                onClick={logout}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2
                  bg-red-600 text-white rounded-lg text-sm font-semibold
                  hover:bg-red-700 transition-colors"
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>
          </div>

          {/* Right column — Stats + Connected + Notifications + Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <StatsGrid stats={stats} />

            {/* Connected Accounts */}
            <ConnectedAccounts stats={stats} />

            {/* Notification Preferences */}
            <NotificationPrefs
              notifications={profile?.notifications}
              phone={profile?.phone}
              onUpdate={handlePreferencesUpdate}
            />

            {/* Activity Feed */}
            <ActivityFeed activities={activities} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;