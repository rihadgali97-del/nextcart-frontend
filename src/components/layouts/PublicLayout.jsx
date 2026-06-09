import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-[#c4a456]/20">
      {/* Central Nav wrapper */}
      <Navbar />
      
      {/* Main content renders here dynamically depending on route path */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Clean Global Micro Footer */}
      <footer className="bg-[#0f2a29] text-white/40 text-xs py-8 px-6 text-center border-t border-white/5">
        <p>© {new Date().getFullYear()} NextCart Marketplace Engine. Powered by TriNova Technologies.</p>
      </footer>
    </div>
  );
};

export default PublicLayout;