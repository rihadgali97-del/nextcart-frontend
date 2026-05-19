import React, { useEffect, useState } from 'react';
import AdminSidebar from '../shared/AdminSidebar';
import VendorSidebar from '../shared/VendorSidebar';
import Sidebar from '../shared/Sidebar';

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
        console.error("NextCart Auth Error", error);
        localStorage.removeItem('user');
      }
    }
    setIsInitializing(false);
  }, []);

  const renderSidebar = () => {
    if (isInitializing) return <div className="w-20 bg-[#0f2a29] min-h-screen animate-pulse" />;

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
    <div className="flex bg-ncBg min-h-screen transition-all duration-500 ease-in-out overflow-hidden">
      {/* 1. Dynamic Navigation */}
      {renderSidebar()}
      
      {/* 2. Content Area - Width adjusts automatically because of flex-1 */}
      <div className="flex-1 h-screen overflow-y-auto scroll-smooth bg-[#f8fafb]">
        <div className="p-8 animate-in fade-in zoom-in-95 duration-700">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;