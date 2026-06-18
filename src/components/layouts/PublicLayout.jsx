import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Footer from '../../pages/Footer';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-[#c4a456]/20">
      <Navbar />

      <main className="flex-grow pt-24 md:pt-28">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default PublicLayout;
