import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { ShoppingBag, Search, User, LogOut, Menu, X } from 'lucide-react';
import Logo from './Logo';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('token');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
  ];

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setMobileOpen(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    if (location.pathname === '/search') {
      setSearchQuery(searchParams.get('q') || '');
    }
  }, [location.pathname, searchParams]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f2a29]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link to="/home" className="flex items-center gap-3 group">
            <Logo lightText />
          </Link>
        </div>

        <div className="hidden md:flex items-center min-w-0">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full max-w-xs bg-white border border-slate-200 px-3 py-2 shadow-sm">
            <Search size={16} className="text-slate-400" />
            <input
              type="search"
              aria-label="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products"
              className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 text-sm"
            />
            <button type="submit" className="bg-[#c4a456] px-3 py-1.5 text-xs font-bold uppercase text-[#0f2a29]">Search</button>
          </form>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <button onClick={handleSearchSubmit} aria-label="Search" className="p-2 rounded-full bg-white/10 text-white/90 hover:bg-white/15 transition">
            <Search size={18} />
          </button>
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-white/90"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-8" role="navigation" aria-label="Primary">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                  isActive ? 'text-[#c4a456]' : 'text-white/70 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {token ? (
            <>
              <button 
                onClick={() => navigate('/')} 
                className="p-2.5 bg-white/5 border border-white/10 text-[#c4a456] rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 text-xs font-bold uppercase"
              >
                <User size={16} />
                Dashboard
              </button>
              <button 
                onClick={handleLogout}
                className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/login')} 
                className="text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider hidden sm:block"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/register')} 
                className="px-5 py-2.5 bg-[#c4a456] hover:bg-[#b3934b] text-[#0f2a29] font-black text-xs rounded-xl transition-all shadow-md shadow-[#c4a456]/10"
              >
                Join NextCart
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`md:hidden transition-all ${mobileOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`} aria-hidden={!mobileOpen}>
        <div className="px-6 pb-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!searchQuery.trim()) return;
            setMobileOpen(false);
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
          }} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 mb-4">
            <Search size={16} className="text-slate-400" />
            <input
              type="search"
              aria-label="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, vendors, or categories"
              className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400 text-sm"
            />
          </form>

          <div className="flex flex-col gap-3 py-4">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-white/80 py-2 block">
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-white/5 flex flex-col gap-3">
            {token ? (
              <>
                <button onClick={() => { setMobileOpen(false); navigate('/'); }} className="w-full text-left px-4 py-2 bg-white/5 text-[#c4a456] rounded-md">Dashboard</button>
                <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="w-full text-left px-4 py-2 bg-red-600/10 text-red-400 rounded-md">Log Out</button>
              </>
            ) : (
              <>
                <button onClick={() => { setMobileOpen(false); navigate('/login'); }} className="w-full text-left px-4 py-2 text-white/80 rounded-md">Sign In</button>
                <button onClick={() => { setMobileOpen(false); navigate('/register'); }} className="w-full text-left px-4 py-2 bg-[#c4a456] text-[#0f2a29] font-black rounded-md">Join NextCart</button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;