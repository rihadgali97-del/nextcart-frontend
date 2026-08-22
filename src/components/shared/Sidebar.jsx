import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Package, Settings, 
  Users, ShieldCheck, ClipboardList, LogOut, Store 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && savedUser !== "undefined") {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 1. Define Menu Configurations based on your Backend Roles
  const menuConfig = {
    admin: [
      { icon: <LayoutDashboard size={20} />, label: 'Admin Panel', path: '/admin' },
      { icon: <Users size={20} />, label: 'Manage Users', path: '/admin/users' },
      { icon: <ShieldCheck size={20} />, label: 'Verifications', path: '/admin/verify' },
      { icon: <ClipboardList size={20} />, label: 'All Orders', path: '/admin/orders' },
      { icon: <Settings size={20} />, label: 'System Settings', path: '/settings' },
    ],
    vendor: [
      { icon: <LayoutDashboard size={20} />, label: 'Shop Stats', path: '/vendor/dashboard' },
      { icon: <Package size={20} />, label: 'My Products', path: '/vendor/products' },
      { icon: <ClipboardList size={20} />, label: 'Store Orders', path: '/vendor/orders' },
      { icon: <Settings size={20} />, label: 'Shop Settings', path: '/settings' },
    ],
    customer: [
      { icon: <ShoppingBag size={20} />, label: 'Marketplace', path: '/' },
      { icon: <ClipboardList size={20} />, label: 'My Purchases', path: '/my-orders' },
      { icon: <Settings size={20} />, label: 'Account', path: '/settings' },
    ]
  };

  // 2. Select the correct list based on the user's role (fallback to customer)
  const currentMenuItems = user ? menuConfig[user.role] : menuConfig.customer;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside className="w-72 bg-ncTeal min-h-screen flex flex-col p-6 text-white overflow-y-auto">
      {/* Branding */}
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-ncTeal font-bold text-xl shadow-lg">N</div>
        <span className="text-2xl font-bold tracking-tight">GebeyaPlus</span>
      </div>

      {/* Conditional Menu Rendering */}
      <nav className="flex-1 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold px-4 mb-4">
          {user?.role || 'Guest'} Menu
        </p>
        
        {currentMenuItems?.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <button 
              key={idx} 
              onClick={() => navigate(item.path)} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium ${
                isActive ? 'bg-ncGold text-white shadow-lg' : 'hover:bg-white/10 text-white/70 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

{/* Profile Card */}
<div className="mt-auto pt-6 border-t border-white/10">
  <div className="bg-[#1a3433] p-4 rounded-3xl border border-white/5 shadow-sm">
    <div className="flex items-center gap-3">
      {/* Avatar Circle */}
      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-ncGold to-amber-200 flex items-center justify-center text-white font-bold border-2 border-white/20">
        {user?.firstName ? (
          `${user.firstName[0]}${user.lastName?.[0] || ''}`
        ) : (
          user?.role?.[0]?.toUpperCase() || '?'
        )}
      </div>

      <div className="overflow-hidden">
        {/* Name Display: Shows Full Name, or falls back to Role if names are missing */}
        <p className="text-sm font-bold truncate">
          {user?.firstName 
            ? `${user.firstName} ${user.lastName || ''}` 
            : (user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)) || 'Guest'}
        </p>
        <p className="text-[10px] text-white/50 capitalize italic">
          {user?.role || 'Guest'} Account
        </p>
      </div>
    </div>

    <button 
      onClick={handleLogout} 
      className="w-full mt-4 py-2.5 bg-ncGold/10 text-ncGold text-xs font-bold rounded-xl hover:bg-ncGold/20 transition-all flex items-center justify-center gap-2"
    >
      <LogOut size={14} /> Log Out
    </button>
  </div>
  <p className="text-[8px] text-center text-white/30 mt-4 uppercase tracking-widest">
    GebeyaPlus v1.0 • 2026
  </p>
</div>
    </aside>
  );
};

export default Sidebar;