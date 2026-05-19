import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Bell, Save, 
  Camera, CheckCircle, AlertCircle, Loader2 
} from 'lucide-react';
import { getVendorProfile, updateProfile, changePassword, updateNotifications } from '../../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form States
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', bio: '' });
  const [securityData, setSecurityData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [notifData, setNotifData] = useState({ emailOrders: true, emailMarketing: false, pushAlerts: true });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const res = await getVendorProfile();
      const user = res.data.user || res.data;
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || ''
      });
      if (user.notifications) setNotifData(user.notifications);
    } catch (err) {
      showStatus('error', 'Failed to load profile data');
    }
  };

  const showStatus = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(profileData);
      showStatus('success', 'Profile updated successfully!');
    } catch (err) {
      showStatus('error', err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      return showStatus('error', 'Passwords do not match');
    }
    setLoading(true);
    try {
      await changePassword({
        oldPassword: securityData.oldPassword,
        newPassword: securityData.newPassword
      });
      showStatus('success', 'Password changed successfully!');
      setSecurityData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showStatus('error', err.response?.data?.message || 'Password update failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Public Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500 min-h-screen bg-[#f8fafc]">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#0f2a29]">Account Settings</h1>
        <p className="text-slate-500 font-medium uppercase tracking-wider text-xs mt-1">Manage your NextCart vendor identity and security</p>
      </div>

      {/* Status Toasts */}
      {message.text && (
        <div className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-[#0f2a29] text-[#c4a456] shadow-lg shadow-[#0f2a29]/10' 
                : 'text-slate-400 hover:bg-slate-200/50 hover:text-[#0f2a29]'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="md:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
          
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 overflow-hidden group-hover:border-[#c4a456] transition-colors">
                    <User size={40} />
                  </div>
                  <button type="button" className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-md border border-slate-100 text-[#c4a456] hover:scale-110 transition-transform">
                    <Camera size={16} />
                  </button>
                </div>
                <div>
                  <h3 className="font-bold text-[#0f2a29] text-lg">Profile Picture</h3>
                  <p className="text-slate-400 text-sm">PNG or JPG, max 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-[#c4a456] focus:ring-0 transition-all font-medium text-[#0f2a29]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                  <input 
                    type="email" 
                    disabled
                    value={profileData.email}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 border-transparent text-slate-400 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Business Phone</label>
                <input 
                  type="text" 
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-[#c4a456] focus:ring-0 transition-all font-medium text-[#0f2a29]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Bio / Shop Description</label>
                <textarea 
                  rows="4"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-[#c4a456] focus:ring-0 transition-all font-medium text-[#0f2a29]"
                ></textarea>
              </div>

              <button 
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-[#0f2a29] text-[#c4a456] px-8 py-3 rounded-2xl font-bold hover:bg-[#163a39] transition-all disabled:opacity-50 border border-[#c4a456]/20"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                Save Changes
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Current Password</label>
                <input 
                  type="password" 
                  required
                  value={securityData.oldPassword}
                  onChange={(e) => setSecurityData({...securityData, oldPassword: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-[#c4a456] focus:ring-0 transition-all text-[#0f2a29]"
                />
              </div>
              <hr className="border-slate-100" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">New Password</label>
                  <input 
                    type="password" 
                    required
                    value={securityData.newPassword}
                    onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-[#c4a456] focus:ring-0 transition-all text-[#0f2a29]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Confirm Password</label>
                  <input 
                    type="password" 
                    required
                    value={securityData.confirmPassword}
                    onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-[#c4a456] focus:ring-0 transition-all text-[#0f2a29]"
                  />
                </div>
              </div>
              <button 
                disabled={loading}
                className="bg-[#0f2a29] text-[#c4a456] px-8 py-3 rounded-2xl font-bold hover:bg-[#163a39] transition-all disabled:opacity-50 flex items-center gap-2 border border-[#c4a456]/20"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                Update Password
              </button>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="font-bold text-[#0f2a29] text-lg">Email Preferences</h3>
                <div className="space-y-4">
                  {[
                    { id: 'emailOrders', title: 'Order Updates', desc: 'Get notified when you receive a new order', val: notifData.emailOrders },
                    { id: 'emailMarketing', title: 'Marketing', desc: 'Receive newsletters and platform tips', val: notifData.emailMarketing },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="font-bold text-[#0f2a29]">{item.title}</p>
                        <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={item.val}
                          onChange={() => {
                            const updated = { ...notifData, [item.id]: !item.val };
                            setNotifData(updated);
                            updateNotifications(updated);
                          }}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c4a456]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;