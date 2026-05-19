import React, { useState } from 'react';
import { 
  UserCircle, Bell, Palette, Package, Key, Globe, 
  ChevronLeft, MessageSquare, ShieldCheck, CreditCard 
} from 'lucide-react';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('notifications');
  
  // State for toggles (matches the "Notification Settings" image)
  const [settings, setSettings] = useState({
    messages: true,
    weeklyReport: true,
    paymentSuccess: false,
    billingAlert: true,
    inventory: false
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: <UserCircle size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'checkout', label: 'Checkout settings', icon: <Package size={18} /> },
    { id: 'security', label: 'Security', icon: <Key size={18} /> },
    { id: 'language', label: 'Language & Region', icon: <Globe size={18} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-3 mb-8 text-slate-500">
        <button className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-semibold tracking-wide uppercase">Settings &gt; {activeSection}</span>
      </div>

      <h1 className="text-4xl font-black text-slate-900 mb-10 tracking-tight">Settings</h1>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Sub-Navigation */}
        <aside className="col-span-12 md:col-span-4 lg:col-span-3">
          <nav className="bg-white/50 border border-slate-200/60 rounded-[2rem] p-2 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                  activeSection === item.id 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-100' 
                    : 'text-slate-500 hover:bg-white/80 hover:text-slate-700'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Column: Content Card */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 lg:p-14">
          {activeSection === 'notifications' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Notifications</h2>
              <p className="text-slate-500 text-sm mb-12 leading-relaxed max-w-md">
                Choose how you'd like to be notified about important events and updates across your NextCart projects.
              </p>

              <div className="space-y-2">
                <ToggleItem 
                  label="New messages" 
                  desc="Receive alert when a customer or team sends a message"
                  checked={settings.messages}
                  onToggle={() => handleToggle('messages')}
                />
                <ToggleItem 
                  label="Weekly report" 
                  desc="Receive a breakdown of your orders, revenue and profit weekly"
                  checked={settings.weeklyReport}
                  onToggle={() => handleToggle('weeklyReport')}
                />
                <ToggleItem 
                  label="Payment success" 
                  desc="Get notified as soon as a payment is confirmed by the system"
                  checked={settings.paymentSuccess}
                  onToggle={() => handleToggle('paymentSuccess')}
                />
                <ToggleItem 
                  label="Billing alert" 
                  desc="Notify me of low balance or potential system billing issues"
                  checked={settings.billingAlert}
                  onToggle={() => handleToggle('billingAlert')}
                />
                <ToggleItem 
                  label="New inventory" 
                  desc="Get notified when a low-stock item is restocked"
                  checked={settings.inventory}
                  onToggle={() => handleToggle('inventory')}
                />
              </div>

              <button className="mt-12 w-full md:w-auto px-10 py-4 bg-ncGold text-white font-bold rounded-2xl shadow-lg shadow-ncGold/20 hover:bg-opacity-90 transition-all">
                Save Changes
              </button>
            </div>
          )}

          {activeSection !== 'notifications' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                {navItems.find(i => i.id === activeSection)?.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800">Coming Soon</h3>
              <p className="text-slate-400 text-sm">We are currently building the {activeSection} management module.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable Toggle Component for the Settings List
const ToggleItem = ({ label, desc, checked, onToggle }) => (
  <div className="flex items-center justify-between py-5 border-b border-slate-50 last:border-0">
    <div className="pr-8">
      <h4 className="text-sm font-bold text-slate-800 mb-1">{label}</h4>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
    <button 
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-ncGold' : 'bg-slate-200'}`}
    >
      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

export default Settings;