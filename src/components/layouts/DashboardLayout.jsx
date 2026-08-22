import React, { useEffect, useState } from 'react';
import AdminSidebar from '../shared/AdminSidebar';
import VendorSidebar from '../shared/VendorSidebar';
import Sidebar from '../shared/Sidebar';
import '../../styles/layouts/dashboard-layout.css';

const DashboardLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false); // Global toggle state

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && savedUser !== "undefined") {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("GebeyaPlus Auth Error", error);
        localStorage.removeItem('user');
      }
    }
    setIsInitializing(false);
  }, []);

  const renderSidebar = () => {
    if (isInitializing) return <div className="dashboard-layout__loading-sidebar" />;

    const role = user?.role?.toLowerCase();
    
    // Pass the collapsed state and the toggle function to the sidebars
    const sidebarProps = { isCollapsed, setIsCollapsed };

    switch (role) {
      case 'admin':
        return <AdminSidebar {...sidebarProps} />;
      case 'vendor':
        return <VendorSidebar {...sidebarProps} />;
      default:
        return <Sidebar {...sidebarProps} />;
    }
  };

  return (
    <div className="dashboard-layout">
      {/* 1. Dynamic Navigation */}
      {renderSidebar()}
      
      {/* 2. Content Area - Width adjusts automatically because of flex-1 */}
      <div className="dashboard-layout__content">
        <div className="dashboard-layout__page">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
