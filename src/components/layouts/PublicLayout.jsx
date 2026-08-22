import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Footer from '../../pages/Footer';
import '../../styles/layouts/public-layout.css';

const PublicLayout = () => {
  return (
    <div className="public-layout">
      <Navbar />

      <main className="public-layout__content">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default PublicLayout;
