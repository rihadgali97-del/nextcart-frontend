import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShoppingBag, Search, User, LogOut } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Find Products', path: '/search' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f2a29]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Identity */}
        <Link to="/home" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#0f2a29] font-black text-xl transition-transform group-hover:rotate-12">
            N
          </div>
          <span className="text-xl font-black text-white tracking-tight">
            Next<span className="text-[#c4a456]">Cart</span>
          </span>
        </Link>

        {/* Modular Route Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
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

        {/* Dynamic Action Buttons */}
        <div className="flex items-center gap-4">
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
    </nav>
  );
};

export default Navbar;