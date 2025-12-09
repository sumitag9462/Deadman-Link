import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Calendar, Mail, Shield, Camera, Trash2, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      setUserData(response.data.user);
      setName(response.data.user.name || '');
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load user data');
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/auth/update-profile', { name });
      toast.success('Profile updated successfully');
      await fetchUserData();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      uploadAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (base64Image) => {
    setUploadingAvatar(true);
    try {
      await api.patch('/auth/update-avatar', { avatar: base64Image });
      toast.success('Profile picture updated successfully');
      await fetchUserData();
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setLoading(true);
    try {
      await api.delete('/auth/remove-avatar');
      toast.success('Profile picture removed');
      setAvatarPreview(null);
      await fetchUserData();
    } catch (error) {
      console.error('Failed to remove avatar:', error);
      toast.error('Failed to remove profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.prompt('Type "DELETE" to confirm account deletion:');
    if (confirmed !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }

    setLoading(true);
    try {
      await api.delete('/auth/delete-account');
      toast.success('Account deleted successfully');
      logout();
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">Settings</h1>
        <p className="text-sm text-slate-400">Manage your account and preferences</p>
      </div>

      {/* Account Overview */}
      <Card className="bg-slate-900/50 border-slate-800">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {userData.avatar || avatarPreview ? (
                <img 
                  src={avatarPreview || userData.avatar} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-500/30 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/20">
                  {userData.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg shadow-lg transition-colors disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              {(userData.avatar || avatarPreview) && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={loading}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg shadow-lg transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{userData.name}</h3>
              <p className="text-slate-400 text-sm">{userData.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  userData.role === 'admin' 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                }`}>
                  {userData.role === 'admin' ? '👑 Admin' : '👤 User'}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Joined {new Date(userData.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Update */}
        <div className="border-t border-slate-700/50 pt-6">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile Information
          </h4>
          <div className="grid gap-4 max-w-xl">
            <Input 
              label="Display Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="w-4 h-4"/>}
              disabled={loading}
            />
            <Input 
              label="Email Address" 
              value={userData.email}
              icon={<Mail className="w-4 h-4"/>}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
            <Button 
              onClick={handleUpdateProfile}
              disabled={loading || name === userData.name}
              className="w-fit"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="bg-slate-900/50 border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Security</h3>
        </div>
        <div className="space-y-4 max-w-xl">
          <Input 
            type="password" 
            label="Current Password" 
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />
          <Input 
            type="password" 
            label="New Password" 
            placeholder="Enter new password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
          />
          <Input 
            type="password" 
            label="Confirm New Password" 
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
          />
          <Button 
            onClick={handleChangePassword}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            variant="secondary" 
            className="w-full"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </Card>

      {/* Account Stats */}
      <Card className="bg-slate-900/50 border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Account Information</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Account ID</p>
            <p className="text-white font-mono text-sm">{userData.id}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Account Status</p>
            <p className="text-emerald-400 font-medium">Active</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Member Since</p>
            <p className="text-white font-medium">
              {new Date(userData.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Account Type</p>
            <p className="text-white font-medium capitalize">{userData.role}</p>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-red-500/5 border-red-500/30">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Danger Zone</h3>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Once you delete your account, there is no going back. All your links, analytics, and data will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                logout();
              }
            }}
          >
            Logout
          </Button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={loading}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </Card>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100000] p-4">
          <div className="bg-slate-900 rounded-xl border border-red-500/30 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete Account</h3>
                <p className="text-slate-400 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <p className="text-slate-300 text-sm mb-2">This will permanently delete:</p>
                <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
                  <li>Your profile and account data</li>
                  <li>All your shortened links</li>
                  <li>All analytics and statistics</li>
                  <li>All reports and moderation history</li>
                </ul>
              </div>

              <div>
                <label className="text-slate-400 text-sm block mb-2">
                  Type <span className="font-bold text-red-400">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  id="delete-confirmation"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Forever
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Settings;