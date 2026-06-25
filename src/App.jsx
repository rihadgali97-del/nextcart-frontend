import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Layout & Common
import DashboardLayout from './components/layouts/DashboardLayout';
import PublicLayout from './components/layouts/PublicLayout';
import Settings from './pages/vendor/Settings'; 

// Public Feature Pages
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import ProductSearch from './components/ProductSearch';
import ProximitySearch from './components/ProximitySearch';
import Search from './components/Search';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageVendors from './pages/admin/ManageVendors';
import ManageUsers from './pages/admin/ManageUsers';
import ManageProducts from './pages/admin/ManageProducts';
import SystemSettings from './pages/admin/SystemSettings';

// Vendor Pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorInventory from './pages/vendor/VendorInventory'; 
import VendorOrders from './pages/vendor/VendorOrders';
import VendorWallet from './pages/vendor/VendorWallet';
import VendorReviews from './pages/vendor/VendorReviews'; 

// Customer Pages
import CustomerDashboard from './pages/customer/Customerdashboard';

// Payment Pages
import TelebirrPayment from './pages/payment/TelebirrPayment';
import PaymentSuccess  from './pages/payment/PaymentSuccess';

// Messaging
import Messages from './pages/vendor/Messages';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  if (!token) return <Navigate to="/login" replace />;

  if (userString && userString !== "undefined") {
    try {
      const user = JSON.parse(userString);
      const userRole = user.role?.toLowerCase();

      if (allowedRole && userRole !== allowedRole.toLowerCase()) {
        return <Navigate to="/" replace />;
      }
      return children;
    } catch (e) {
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }
  }
  return <Navigate to="/login" replace />;
};

const RoleRedirector = () => {
  const userString = localStorage.getItem('user');
  if (!userString || userString === "undefined") return <Navigate to="/login" replace />;
  
  try {
    const user = JSON.parse(userString);
    const role = user.role?.toLowerCase();
    
    if (role === 'admin')    return <Navigate to="/admin"    replace />;
    if (role === 'vendor')   return <Navigate to="/vendor"   replace />;
    if (role === 'customer') return <Navigate to="/customer" replace />;
    
    return <Navigate to="/settings" replace />;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

function App() {
  const userString = localStorage.getItem('user');
  let user = null;
  
  try {
    if (userString && userString !== "undefined") {
      user = JSON.parse(userString);
    }
  } catch (err) {
    console.error("Failed to parse user for routing", err);
  }

  // Inject Google OAuth Client contextual validation trees on wrapper bounds
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "PROVIDE_YOUR_CLIENT_ID_KEY";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/search" element={<Search />} />
            <Route path="/proximity-search" element={<ProximitySearch />} />
          </Route>

          {/* --- Admin Module --- */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users"     element={<ProtectedRoute allowedRole="admin"><DashboardLayout><ManageUsers /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/products"  element={<ProtectedRoute allowedRole="admin"><DashboardLayout><ManageProducts /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/vendors"   element={<ProtectedRoute allowedRole="admin"><DashboardLayout><ManageVendors /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/settings"  element={<ProtectedRoute allowedRole="admin"><DashboardLayout><SystemSettings /></DashboardLayout></ProtectedRoute>} />

          {/* --- Vendor Module --- */}
          <Route path="/vendor"          element={<ProtectedRoute allowedRole="vendor"><DashboardLayout><VendorDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/vendor/products" element={<ProtectedRoute allowedRole="vendor"><DashboardLayout><VendorInventory /></DashboardLayout></ProtectedRoute>} />
          <Route path="/vendor/orders"   element={<ProtectedRoute allowedRole="vendor"><DashboardLayout><VendorOrders /></DashboardLayout></ProtectedRoute>} />
          <Route path="/vendor/wallet"   element={<ProtectedRoute allowedRole="vendor"><DashboardLayout><VendorWallet /></DashboardLayout></ProtectedRoute>} />
          <Route path="/vendor/reviews"  element={<ProtectedRoute allowedRole="vendor"><DashboardLayout><VendorReviews /></DashboardLayout></ProtectedRoute>} />
          <Route path="/vendor/messages" element={<ProtectedRoute allowedRole="vendor"><DashboardLayout><Messages currentUser={user} /></DashboardLayout></ProtectedRoute>} />

          {/* --- Customer Module --- */}
          <Route path="/customer" element={
            <ProtectedRoute allowedRole="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          } />

          {/* --- Payment Module (protected, any logged-in user) --- */}
          <Route path="/telebirr-pay" element={
            <ProtectedRoute>
              <TelebirrPayment />
            </ProtectedRoute>
          } />

          <Route path="/payment-success" element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          } />

          {/* --- Shared Settings (Universal) --- */}
          <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
