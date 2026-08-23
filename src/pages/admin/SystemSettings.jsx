import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Bell, Save, RefreshCw, DollarSign, Globe, 
  History, Truck, Percent, AlertTriangle, Database, Mail, Smartphone
} from 'lucide-react';
import { getUserProfile, getAdminSettings, updateAdminSettings, getAuditLogs, updateProfile } from '../../services/api';

const displayIp = (ip) => {
  if (!ip) return 'Unavailable';
  if (ip === '::1') return '127.0.0.1';
  return ip.replace(/^::ffff:/, '');
};

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  
  const [profile, setProfile] = useState({ 
    name: '', 
    email: '', 
    notifications: { email: true, push: false } 
  });

  const [adminConfig, setAdminConfig] = useState({ 
    commissionRate: 0, 
    defaultCurrency: 'USD',
    globalConfigurations: {
      maintenanceMode: false,
      taxRate: 0,
      minOrderValue: 1,
      maxOrderValue: 10000,
      freeShippingThreshold: 0,
      allowNewVendors: true
    }
  });
  const globalConfig = adminConfig.globalConfigurations || {};
  const updateGlobalConfig = (key, value) => setAdminConfig(prev => ({
    ...prev,
    globalConfigurations: { ...(prev.globalConfigurations || {}), [key]: value }
  }));

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'audit') {
        const res = await getAuditLogs();
        setLogs(res.data?.data || []);
      } else {
        const [pRes, aRes] = await Promise.all([getUserProfile(), getAdminSettings()]);
        
        if (pRes.data?.data) {
          setProfile({
            ...pRes.data.data,
            notifications: pRes.data.data.notifications || { email: false, push: false }
          });
        }
        
        if (aRes.data?.data) {
          setAdminConfig(aRes.data.data);
        }
      }
    } catch (err) { 
      console.error("Data load failed", err); 
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (activeTab === 'profile') {
        await updateProfile(profile);
        alert("Personal profile updated.");
      } else {
        await updateAdminSettings(adminConfig);
        alert("System parameters updated successfully.");
      }
    } catch (err) { 
      alert("Error saving changes."); 
    } finally { 
      setLoading(false); 
    }
  };

  const toggleNotif = (type) => {
    setProfile(prev => ({
      ...prev,
      notifications: { 
        ...(prev.notifications || { email: false, push: false }), 
        [type]: !prev.notifications?.[type] 
      }
    }));
  };

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-[#0f2a29] tracking-tight">System Control</h1>
          <p className="text-slate-500 font-medium">Global platform configuration & governance</p>
        </div>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          {['profile', 'finance', 'shipping', 'audit'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-[#c4a456] text-white shadow-md' : 'text-slate-400 hover:text-[#0f2a29]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-10">
            
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Full Name</label>
                    <input type="text" value={profile.name || ''} 
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:border-[#c4a456] outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Email Address</label>
                    <input type="email" value={profile.email || ''} 
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:border-[#c4a456] outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="font-black text-[#0f2a29] mb-6 flex items-center gap-2">
                    <Bell size={18} className="text-[#c4a456]"/> Notification Alerts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                      <div className="flex items-center gap-4">
                        <Mail className="text-slate-400" />
                        <div>
                          <p className="font-bold text-sm">Email Reports</p>
                          <p className="text-[10px] text-slate-500">Weekly sales summary</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => toggleNotif('email')}
                        className={`w-12 h-6 rounded-full transition-all relative ${profile.notifications?.email ? 'bg-[#c4a456]' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.notifications?.email ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                      <div className="flex items-center gap-4">
                        <Smartphone className="text-slate-400" />
                        <div>
                          <p className="font-bold text-sm">Push Notifications</p>
                          <p className="text-[10px] text-slate-500">Real-time order alerts</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => toggleNotif('push')}
                        className={`w-12 h-6 rounded-full transition-all relative ${profile.notifications?.push ? 'bg-[#c4a456]' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.notifications?.push ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-5 bg-[#0f2a29] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#c4a456] transition-all disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            )}

            {activeTab === 'finance' && (
              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                    <label className="text-[10px] font-black uppercase text-[#c4a456] tracking-tighter">Commission Structure</label>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-black text-[#0f2a29]">$</div>
                      <input type="number" value={adminConfig.commissionRate}
                        onChange={(e) => setAdminConfig({...adminConfig, commissionRate: e.target.value})}
                        className="w-full bg-transparent text-3xl font-black outline-none"
                      />
                      <span className="text-xl font-bold text-slate-300">%</span>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                    <label className="text-[10px] font-black uppercase text-[#c4a456] tracking-tighter">System Currency</label>
                    <div className="flex items-center gap-4">
                      <Globe className="text-slate-300" />
                      <select 
                        value={adminConfig.defaultCurrency || 'USD'}
                        onChange={(e) => setAdminConfig({...adminConfig, defaultCurrency: e.target.value})}
                        className="w-full bg-transparent text-2xl font-black outline-none appearance-none cursor-pointer"
                      >
                        <option value="USD">USD - Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - Pound</option>
                        <option value="ETB">ETB - Birr</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl space-y-4 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-[#c4a456] tracking-tighter">Global Tax Rate</label>
                    <div className="flex items-center gap-4">
                      <Percent className="text-slate-300" />
                      <input type="number" value={globalConfig.taxRate ?? 0}
                        onChange={(e) => updateGlobalConfig('taxRate', Number(e.target.value))}
                        className="w-full bg-transparent text-3xl font-black outline-none"
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-5 bg-[#0f2a29] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#c4a456] transition-all">
                  Update Financial Rules
                </button>
              </form>
            )}

            {activeTab === 'shipping' && (
              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6">
                   <Truck className="text-[#c4a456]" size={40} />
                   <div className="flex-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Free Shipping Threshold</label>
                      <input type="number" value={globalConfig.freeShippingThreshold ?? 0}
                        onChange={(e) => updateGlobalConfig('freeShippingThreshold', Number(e.target.value))}
                        className="w-full bg-transparent text-2xl font-black outline-none"
                      />
                   </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-5 bg-[#0f2a29] text-white rounded-2xl font-black uppercase hover:bg-[#c4a456] transition-all">
                  Save Shipping Rules
                </button>
              </form>
            )}

            {activeTab === 'audit' && (
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black">
                     <tr><th className="px-6 py-4">Action</th><th className="px-6 py-4">Admin</th><th className="px-6 py-4">IP Address</th><th className="px-6 py-4">Details</th><th className="px-6 py-4">Timestamp</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {logs.map((log) => (
                       <tr key={log._id}>
                         <td className="px-6 py-4 font-bold">{log.action}</td>
                         <td className="px-6 py-4">{log.adminId?.name || log.adminEmail || 'System'}</td>
                         <td className="px-6 py-4 font-mono text-xs">{displayIp(log.ipAddress)}</td>
                         <td className="px-6 py-4 text-slate-500">{log.details || '—'}</td>
                         <td className="px-6 py-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className={`p-8 rounded-[2.5rem] border-2 ${globalConfig.maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className={globalConfig.maintenanceMode ? 'text-red-500' : 'text-slate-300'} />
              <button onClick={() => updateGlobalConfig('maintenanceMode', !globalConfig.maintenanceMode)}
                className={`w-14 h-7 rounded-full relative transition-all ${globalConfig.maintenanceMode ? 'bg-red-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${globalConfig.maintenanceMode ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
            <h3 className="font-black">Maintenance Mode</h3>
            <p className="text-xs text-slate-500">Disable storefront for all users.</p>
          </div>

          <div className="p-8 bg-[#0f2a29] rounded-[2.5rem] text-white relative overflow-hidden">
             <Database className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
             <h3 className="text-xs font-black uppercase text-[#c4a456] mb-2">System Health</h3>
             <p className="text-2xl font-black">Optimal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;