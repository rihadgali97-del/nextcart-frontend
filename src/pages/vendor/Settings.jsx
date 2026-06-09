import React, { useState, useEffect } from 'react';
import {
  User, Lock, Bell, Save, Camera,
  CheckCircle, AlertCircle, Loader2, Shield, Eye, EyeOff
} from 'lucide-react';
import { getVendorProfile, updateProfile, changePassword, updateNotifications } from '../../services/api';

const C = { dark:'#0f2a29', gold:'#c4a456', light:'#f8fafb', border:'#e8ede9', muted:'#7a8c7e' };

const Input = ({ label, type="text", value, onChange, placeholder, disabled=false, hint }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div className="relative">
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled}
          className={`w-full px-4 py-3.5 rounded-2xl text-sm font-medium transition-all outline-none border
            ${disabled
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-transparent'
              : 'bg-slate-50 border-transparent focus:bg-white focus:border-[#c4a456]'}`}
          style={{ color: disabled ? undefined : C.dark }}
        />
        {isPassword && (
          <button type="button" onClick={()=>setShow(p=>!p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all">
            {show ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-slate-400 px-1">{hint}</p>}
    </div>
  );
};

const Toggle = ({ checked, onChange, label, desc }) => (
  <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100">
    <div>
      <p className="font-bold text-sm" style={{ color:C.dark }}>{label}</p>
      {desc && <p className="text-xs text-slate-400 font-medium mt-0.5">{desc}</p>}
    </div>
    <div onClick={()=>onChange(!checked)}
      className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-200
        ${checked ? 'bg-[#c4a456]' : 'bg-slate-300'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200
        ${checked ? 'left-7' : 'left-1'}`}/>
    </div>
  </div>
);

export default function Settings() {
  const [activeTab,    setActiveTab]    = useState('profile');
  const [loading,      setLoading]      = useState(false);
  const [msg,          setMsg]          = useState(null);
  const [profileData,  setProfileData]  = useState({ name:'', email:'', phone:'', bio:'' });
  const [securityData, setSecurityData] = useState({ oldPassword:'', newPassword:'', confirmPassword:'' });
  const [notifData,    setNotifData]    = useState({ emailOrders:true, emailMarketing:false, pushAlerts:true });

  useEffect(() => {
    (async () => {
      try {
        const res  = await getVendorProfile();
        const user = res.data?.user || res.data?.data || res.data || {};
        setProfileData({ name:user.name||'', email:user.email||'', phone:user.phone||'', bio:user.bio||'' });
        if (user.settings?.notifications) setNotifData(user.settings.notifications);
      } catch { showMsg('error','Failed to load profile'); }
    })();
  }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ name:profileData.name, email:profileData.email });
      showMsg('success','Profile updated successfully!');
    } catch (err) { showMsg('error', err.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword)
      return showMsg('error','Passwords do not match');
    if (securityData.newPassword.length < 6)
      return showMsg('error','Password must be at least 6 characters');
    setLoading(true);
    try {
      await changePassword({ currentPassword:securityData.oldPassword, newPassword:securityData.newPassword });
      showMsg('success','Password changed successfully!');
      setSecurityData({ oldPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) { showMsg('error', err.response?.data?.message || 'Password update failed'); }
    finally { setLoading(false); }
  };

  const handleNotifChange = async (key, val) => {
    const updated = { ...notifData, [key]: val };
    setNotifData(updated);
    try { await updateNotifications({ notifications: updated }); }
    catch { showMsg('error','Failed to save preferences'); }
  };

  const tabs = [
    { id:'profile',       label:'Profile',       icon:User   },
    { id:'security',      label:'Security',      icon:Lock   },
    { id:'notifications', label:'Notifications', icon:Bell   },
  ];

  return (
    <div className="p-6 md:p-8 min-h-screen" style={{ background:C.light }}>

      {/* Toast */}
      {msg && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300
          ${msg.type==='success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.type==='success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
          <span className="font-bold text-sm">{msg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight" style={{ color:C.dark }}>Account Settings</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Manage your NextCart vendor identity and security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Sidebar tabs */}
        <div className="space-y-2">
          {tabs.map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all
                ${activeTab===tab.id
                  ? 'shadow-lg shadow-[#0f2a29]/10'
                  : 'text-slate-400 hover:bg-slate-200/50 hover:text-[#0f2a29]'}`}
              style={activeTab===tab.id ? { background:C.dark, color:C.gold } : {}}>
              <tab.icon size={18}/>
              {tab.label}
            </button>
          ))}

          {/* Account info card */}
          <div className="mt-6 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={15} style={{ color:C.gold }}/>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Account Status</p>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Role</span>
                <span className="font-black capitalize" style={{ color:C.dark }}>
                  {JSON.parse(localStorage.getItem('user')||'{}').role || 'Vendor'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Rank</span>
                <span className="font-black" style={{ color:C.gold }}>
                  {JSON.parse(localStorage.getItem('user')||'{}').reputation?.rank || 'Starter'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="md:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">

          {/* ── PROFILE TAB ─────────────────────────────────────────────── */}
          {activeTab==='profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden"
                    style={{ color:C.muted }}>
                    <User size={36}/>
                  </div>
                  <button type="button"
                    className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-xl shadow-md border border-slate-100 transition-transform hover:scale-110"
                    style={{ color:C.gold }}>
                    <Camera size={14}/>
                  </button>
                </div>
                <div>
                  <h3 className="font-black" style={{ color:C.dark }}>{profileData.name || 'Your Name'}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{profileData.email}</p>
                  <p className="text-[10px] mt-1 font-black uppercase tracking-wider" style={{ color:C.gold }}>
                    {JSON.parse(localStorage.getItem('user')||'{}').reputation?.rank || 'Starter'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Full Name"      value={profileData.name}  onChange={v=>setProfileData(p=>({...p,name:v}))}  placeholder="Your name"/>
                <Input label="Email Address"  value={profileData.email} onChange={()=>{}} placeholder="email@example.com" disabled hint="Email cannot be changed"/>
              </div>
              <Input label="Business Phone" value={profileData.phone} onChange={v=>setProfileData(p=>({...p,phone:v}))} placeholder="+251 9XX XXX XXX"/>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bio / Shop Description</label>
                <textarea rows={4} value={profileData.bio} onChange={e=>setProfileData(p=>({...p,bio:e.target.value}))}
                  placeholder="Describe your shop and what you sell…"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-[#c4a456] outline-none text-sm font-medium resize-none transition-all"
                  style={{ color:C.dark }}/>
              </div>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm disabled:opacity-50 transition-all"
                style={{ background:C.dark, color:C.gold }}>
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                Save Changes
              </button>
            </form>
          )}

          {/* ── SECURITY TAB ─────────────────────────────────────────────── */}
          {activeTab==='security' && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                <Shield size={18} className="text-blue-500 flex-shrink-0"/>
                <p className="text-xs font-medium text-blue-700">
                  Use a strong password with at least 8 characters, including numbers and symbols.
                </p>
              </div>
              <Input label="Current Password"  type="password" value={securityData.oldPassword}
                onChange={v=>setSecurityData(p=>({...p,oldPassword:v}))} placeholder="••••••••"/>
              <div className="border-t border-slate-100 pt-6"/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="New Password"     type="password" value={securityData.newPassword}
                  onChange={v=>setSecurityData(p=>({...p,newPassword:v}))}
                  placeholder="••••••••" hint="Min. 6 characters"/>
                <Input label="Confirm Password" type="password" value={securityData.confirmPassword}
                  onChange={v=>setSecurityData(p=>({...p,confirmPassword:v}))} placeholder="••••••••"/>
              </div>
              {/* Password strength */}
              {securityData.newPassword && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 px-1">Strength</p>
                  <div className="flex gap-1.5">
                    {[1,2,3,4].map(i=>(
                      <div key={i} className="h-1.5 flex-1 rounded-full transition-all"
                        style={{ background: securityData.newPassword.length >= i*2
                          ? i<=1?'#ef4444':i<=2?'#f59e0b':i<=3?C.gold:'#22c55e'
                          : '#e2e8f0' }}/>
                    ))}
                  </div>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm disabled:opacity-50 transition-all"
                style={{ background:C.dark, color:C.gold }}>
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Lock size={16}/>}
                Update Password
              </button>
            </form>
          )}

          {/* ── NOTIFICATIONS TAB ─────────────────────────────────────────── */}
          {activeTab==='notifications' && (
            <div className="space-y-8">
              <div>
                <h3 className="font-black text-lg mb-1" style={{ color:C.dark }}>Notification Preferences</h3>
                <p className="text-sm text-slate-400 font-medium">Control how NextCart reaches you</p>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                <Toggle checked={notifData.emailOrders}    label="Order Updates"
                  desc="Get notified when you receive a new order or status changes"
                  onChange={v=>handleNotifChange('emailOrders',v)}/>
                <Toggle checked={notifData.emailMarketing} label="Marketing & Tips"
                  desc="Newsletters, platform tips, and promotional offers"
                  onChange={v=>handleNotifChange('emailMarketing',v)}/>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Push</p>
                <Toggle checked={notifData.pushAlerts}     label="Push Alerts"
                  desc="Real-time browser notifications for orders and messages"
                  onChange={v=>handleNotifChange('pushAlerts',v)}/>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}