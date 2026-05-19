import React from 'react';
import { 
  LayoutDashboard, Users, ShieldCheck, ShoppingBag, 
  MessageSquare, ClipboardList, Settings, LogOut, Search,
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// Import your new logo image asset
import nextCartLogo from '../../assets/nextcart-logo.png'; 

const AdminSidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin' },
    { icon: <Users size={20} />, label: 'Manage Users', path: '/admin/users' },
    { icon: <ShieldCheck size={20} />, label: 'Vendors', path: '/admin/vendors' },
    { icon: <ShoppingBag size={20} />, label: 'Products', path: '/admin/products' },
    { icon: <MessageSquare size={20} />, label: 'Reviews', path: '/admin/reviews' },
    { icon: <ClipboardList size={20} />, label: 'Orders', path: '/admin/orders' },
    { icon: <Settings size={20} />, label: 'System Settings', path: '/admin/settings' }, 
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside className={`bg-[#0f2a29] min-h-screen flex flex-col p-4 text-white border-r border-white/5 sticky top-0 transition-all duration-500 ease-in-out ${isCollapsed ? 'w-24' : 'w-72'}`}>
      
      {/* Brand Header & Toggle */}
      <div className="flex items-center justify-between mb-10 px-2">
        
        {/* Inline Layout Container */}
        <div className="flex items-center gap-3 overflow-hidden">
          
          {/* Logo Cropped Inside a Clean White Circle Container */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-start justify-center bg-white min-w-[40px] shadow-lg shadow-black/10">
            <img 
              src={nextCartLogo} 
              alt="NextCart Symbol" 
              className="w-14 max-w-none scale-[1.5] -translate-y-0.5 object-contain" 
            />
          </div>

          {/* Inline Text Header (Hidden smoothly when collapsed) */}
          {!isCollapsed && (
            <h1 className="text-2xl font-black tracking-tight animate-in fade-in slide-in-from-left-2 duration-500 whitespace-nowrap text-white">
              Next<span className="text-[#c4a456]">Cart</span>
            </h1>
          )}
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-[#c4a456] hover:text-white transition-all z-10 ml-2"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Search Bar */}
      <div className={`relative mb-8 group transition-all ${isCollapsed ? 'px-1' : 'px-0'}`}>
        <div className={`flex items-center bg-white/5 border border-white/10 rounded-2xl transition-all ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full px-4 py-3'}`}>
          <Search className={`${isCollapsed ? '' : 'absolute left-4'} text-white/20 group-focus-within:text-[#c4a456] transition-colors`} size={18} />
          {!isCollapsed && (
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-7 bg-transparent border-none text-sm outline-none placeholder:text-white/10" 
            />
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1">
        {!isCollapsed && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#c4a456] font-bold px-4 mb-4 opacity-80 animate-in fade-in duration-500">Admin Panel</p>
        )}
        
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button 
              key={item.label}
              onClick={() => navigate(item.path)} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                isActive 
                ? 'bg-[#c4a456] text-white shadow-lg shadow-[#c4a456]/20' 
                : 'hover:bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              <span className={`${isActive ? 'text-white' : 'text-white/40 group-hover:text-[#c4a456]'} transition-colors min-w-[20px]`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="font-bold text-sm tracking-wide whitespace-nowrap animate-in fade-in duration-500">
                  {item.label}
                </span>
              )}
              
              {/* Tooltip for Collapsed Mode */}
              {isCollapsed && (
                <div className="absolute left-16 bg-[#c4a456] text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile Card */}
      <div className="mt-auto pt-6">
        <div className={`bg-[#1a3433] rounded-[2.5rem] border border-white/5 transition-all ${isCollapsed ? 'p-2' : 'p-5'}`}>
          <div className={`flex items-center gap-4 ${isCollapsed ? 'mb-0 justify-center' : 'mb-5'}`}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#c4a456] to-[#e5c77e] flex items-center justify-center text-[#0f2a29] font-black text-lg border-2 border-white/10 shadow-xl min-w-[40px]">
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden animate-in fade-in duration-500">
                <p className="text-sm font-bold truncate tracking-wide text-white">
                  {user?.name || 'System Admin'}
                </p>
                <p className="text-[10px] text-[#c4a456] font-black uppercase tracking-[0.15em] mt-0.5 opacity-90">
                  {user?.role || 'Administrator'}
                </p>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleLogout} 
            className={`flex items-center justify-center gap-2 bg-[#c4a456]/10 text-[#c4a456] font-black rounded-2xl hover:bg-[#c4a456] hover:text-white transition-all duration-300 uppercase tracking-[0.2em] ${isCollapsed ? 'w-10 h-10 mt-4' : 'w-full py-3.5 text-[10px]'}`}
            title={isCollapsed ? "Log Out" : ""}
          >
            <LogOut size={16} /> {!isCollapsed && "Log Out"}
          </button>
        </div>
        {!isCollapsed && (
          <p className="text-[9px] text-center text-white/10 mt-5 uppercase tracking-[0.4em] font-medium animate-in fade-in">NextCart • BiT 2026</p>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;