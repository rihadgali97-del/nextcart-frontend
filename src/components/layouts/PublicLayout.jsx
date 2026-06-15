import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Logo from '../common/Logo';

const PUBLIC_LINKS = [
  { name: 'Home', path: '/home' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Nearby', path: '/proximity-search' },
  { name: 'Find Products', path: '/search' },
];

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-[#c4a456]/20">
      {/* Central Nav wrapper */}
      <Navbar />
      
      {/* Main content renders here dynamically depending on route path */}
      <main className="flex-grow pt-24 md:pt-28">
        <Outlet />
      </main>

      {/* Clean Global Micro Footer */}
      <footer className="bg-[#0f2a29] text-white/80 py-10 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-[1fr_auto] items-center">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Logo lightText />
            </div>
            <p className="text-sm text-white/60 max-w-2xl">
              NextCart is the trusted public storefront for buyers, connecting nearby sellers with reputation-aware search and seamless checkout.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-[.3em] text-white/60">
            {PUBLIC_LINKS.map((link) => (
              <Link key={link.path} to={link.path} className="transition-colors hover:text-white">
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center text-[11px] text-white/40">
          © {new Date().getFullYear()} NextCart Marketplace Engine. Built for modern multi-vendor commerce.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;