import React from 'react';
import { Search, Bell, LayoutGrid } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-40">
      {/* Search Bar */}
      <div className="relative w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search for everything..." 
          className="w-full bg-slate-100/80 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-ncGold outline-none transition-all"
        />
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-6">
        <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
          <LayoutGrid size={20} />
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800 group-hover:text-ncGold transition-colors">Joy Ezechukwu</p>
            <p className="text-[10px] text-slate-400 font-medium">Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-ncGold to-amber-300 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-xs">JE</div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;