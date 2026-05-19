import React from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, Wallet, 
  Settings, LogOut, Star, ShieldCheck, MessageSquare,
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const VendorSidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { id: 1, icon: LayoutDashboard, label: 'Overview', path: '/vendor' },
    { id: 2, icon: Package, label: 'My Products', path: '/vendor/products' },
    { id: 3, icon: ShoppingCart, label: 'Orders', path: '/vendor/orders' },
    { id: 4, icon: Wallet, label: 'Wallet & Finance', path: '/vendor/wallet' },
    { id: 5, icon: MessageSquare, label: 'Messages', path: '/vendor/messages' },
    { id: 6, icon: Star, label: 'Reviews', path: '/vendor/reviews' },
    { id: 7, icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className={`bg-[#0f2a29] min-h-screen flex flex-col p-4 text-white border-r border-white/5 sticky top-0 transition-all duration-500 ease-in-out ${isCollapsed ? 'w-24' : 'w-72'}`}>
      
      {/* Toggle & Logo */}
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="min-w-[40px] h-10 bg-[#c4a456] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-[#0f2a29] font-black text-xl">V</span>
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-500">
              <h1 className="text-xl font-bold tracking-tight leading-none">NextCart</h1>
              <span className="text-[#c4a456] text-[10px] uppercase font-black tracking-widest">Vendor Pro</span>
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-[#c4a456] hover:text-[#0f2a29] transition-all"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button 
              key={item.id}
              onClick={() => navigate(item.path)} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                isActive ? 'bg-[#c4a456] text-[#0f2a29]' : 'hover:bg-white/5 text-white/60'
              }`}
            >
              <Icon size={20} className="min-w-[20px]" />
              {!isCollapsed && <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>}
              
              {/* Tooltip for Collapsed Mode */}
              {isCollapsed && (
                <div className="absolute left-16 bg-[#c4a456] text-[#0f2a29] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Reputation Quick-Card */}
      <div className="mt-auto space-y-4">
        <div className={`bg-white/5 rounded-2xl border border-white/10 transition-all ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <div className="flex items-center gap-3">
            <div className="min-w-[32px] p-2 bg-[#c4a456]/20 rounded-lg flex items-center justify-center">
              <ShieldCheck size={18} className="text-[#c4a456]" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in duration-500">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Status</p>
                <p className="text-xs font-black text-[#c4a456] uppercase tracking-widest">{user?.reputation?.rank || 'Starter'}</p>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => { localStorage.clear(); navigate('/login'); }}
          className="w-full flex items-center justify-center py-3 bg-[#c4a456]/10 text-[#c4a456] text-[10px] font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all uppercase"
        >
          {isCollapsed ? <LogOut size={18} /> : "Log Out"}
        </button>
      </div>
    </aside>
  );
};

export default VendorSidebar;