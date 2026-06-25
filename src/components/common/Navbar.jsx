import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Imported Terminal icon to visually separate technical developer reference links
import { ShoppingBag, Search, User, LogOut, Menu, X, Terminal } from 'lucide-react';
import Logo from './Logo';
import LanguageSelector from './LanguageSelector';

const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('token');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // Base API URL configuration fallback
  const BACKEND_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://api.yourdomain.com';

  const navLinks = [
    { name: t('navbar.home'), path: '/home' },
    { name: t('navbar.about'), path: '/about' },
    { name: t('navbar.services'), path: '/services' },
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f2a29]/80 backdrop-blur-xl border-b border-white/5 px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/home" className="flex items-center gap-3 group">
            <Logo lightText />
          </Link>
        </div>

        {/* Center-Left: Search Bar (Desktop) */}
        <div className="hidden md:flex items-center min-w-0 flex-1 max-w-xs ml-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full bg-white border border-slate-200 px-3 py-1.5 shadow-sm rounded-md">
            <Search size={14} className="text-slate-400" />
            <input
              type="search"
              aria-label="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('navbar.searchPlaceholder')}
              className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 text-xs"
            />
            <button type="submit" className="bg-[#c4a456] px-2.5 py-1 text-[10px] font-bold uppercase text-[#0f2a29] rounded">
              {t('navbar.searchBtn')}
            </button>
          </form>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSelector />
          <button onClick={handleSearchSubmit} aria-label="Search" className="p-2 rounded-full bg-white/10 text-white/90 hover:bg-white/15 transition">
            <Search size={16} />
          </button>
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-white/90"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Center-Right: Navigation Links */}
        <div className="hidden md:flex items-center gap-6 ml-auto mr-6" role="navigation" aria-label="Primary">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  isActive ? 'text-[#c4a456]' : 'text-white/70 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {/* ── DESKTOP EXTERNAL SWAGGER ROUTE ── */}
          <a
            href={`${BACKEND_URL}/api-docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/50 hover:text-[#c4a456] transition-colors border-l border-white/10 pl-4"
          >
            <Terminal size={12} />
            {t('navbar.apiDocs', 'API Reference')}
          </a>
        </div>

        {/* Right: Auth Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <LanguageSelector />
          
          {token ? (
            <>
              <button 
                onClick={() => navigate('/')} 
                className="px-3 py-1.5 bg-white/5 border border-white/10 text-[#c4a456] rounded-lg hover:bg-white/10 transition-all flex items-center gap-1.5 text-[11px] font-bold uppercase"
              >
                <User size={14} />
                {t('navbar.dashboard')}
              </button>
              <button 
                onClick={handleLogout}
                className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/login')} 
                className="text-white/80 hover:text-white text-[11px] font-bold uppercase tracking-wider hidden sm:block"
              >
                {t('navbar.signIn')}
              </button>
              <button 
                onClick={() => navigate('/register')} 
                className="px-4 py-1.5 bg-[#c4a456] hover:bg-[#b3934b] text-[#0f2a29] font-black text-[11px] rounded-lg transition-all shadow-md shadow-[#c4a456]/10"
              >
                {t('navbar.join')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
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
              placeholder={t('navbar.searchPlaceholder')}
              className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400 text-sm"
            />
          </form>

          <div className="flex flex-col gap-3 py-4">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-white/80 py-2 block">
                {link.name}
              </Link>
            ))}
            
            {/* ── MOBILE EXTERNAL SWAGGER ROUTE ── */}
            <a
              href={`${BACKEND_URL}/api-docs`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-[#c4a456] py-2 border-t border-white/5 mt-1"
            >
              <Terminal size={14} />
              {t('navbar.apiDocs', 'API Reference')}
            </a>
          </div>

          <div className="pt-3 border-t border-white/5 flex flex-col gap-3">
            {token ? (
              <>
                <button onClick={() => { setMobileOpen(false); navigate('/'); }} className="w-full text-left px-4 py-2 bg-white/5 text-[#c4a456] rounded-md">{t('navbar.dashboard')}</button>
                <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="w-full text-left px-4 py-2 bg-red-600/10 text-red-400 rounded-md">Log Out</button>
              </>
            ) : (
              <>
                <button onClick={() => { setMobileOpen(false); navigate('/login'); }} className="w-full text-left px-4 py-2 text-white/80 rounded-md">{t('navbar.signIn')}</button>
                <button onClick={() => { setMobileOpen(false); navigate('/register'); }} className="w-full text-left px-4 py-2 bg-[#c4a456] text-[#0f2a29] font-black rounded-md">{t('navbar.join')}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;