import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ChevronRight, Users, Store } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { loginUser } from '../../services/api';
import Logo from '../../components/common/Logo';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [role, setRole] = useState('customer'); // Tracks context matching choices for Google SignIn
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const processAuthenticationSuccess = (token, dataBlock) => {
    localStorage.setItem('token', token);
    const userData = dataBlock.result || dataBlock.user || dataBlock.data || dataBlock;
    
    const normalizedUser = {
      ...userData,
      role: userData.role ? userData.role.toLowerCase() : 'customer'
    };

    localStorage.setItem('user', JSON.stringify(normalizedUser));

    if (normalizedUser.role === 'admin') {
      window.location.href = '/admin';
    } else if (normalizedUser.role === 'vendor') {
      window.location.href = '/vendor';
    } else {
      window.location.href = '/customer';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await loginUser(formData);
      if (response.data.token) {
        processAuthenticationSuccess(response.data.token, response.data);
      } else {
        setError("Login successful, but user data was missing from the server.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || "Login failed. Check your connection.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      // Direct pipeline deployment handling both register/login dynamically
      const res = await axios.post('http://localhost:5000/api/auth/google-login', {
        idToken: credentialResponse.credential,
        role: role
      });

      if (res.data.token) {
        processAuthenticationSuccess(res.data.token, res.data.result);
      }
    } catch (err) {
      console.error("Google Auth Node Fail:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Google Social single sign-on execution failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-8">
        <div className="mb-4">
          <Logo className="h-10 mx-auto" showText={false} />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-xs font-medium bg-red-50 p-2 rounded">{error}</p>}

          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="email"
              placeholder="Email"
              required
              className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" className="w-full py-3 bg-[#c4a456] text-white font-semibold rounded-md">Sign In</button>
        </form>

        <div className="w-full flex flex-col items-center my-4">
          <div className="relative flex items-center w-full max-w-xs">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="px-3 text-xs text-slate-400">Or continue with</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
        </div>

        <div className="w-full flex justify-center mb-4">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Identity verification flow cancelled.')}
            theme="outline"
            shape="pill"
            text="continue_with"
            width="280px"
          />
        </div>

        <div className="text-center text-sm text-slate-500">
          New here? <button type="button" onClick={() => navigate('/register')} className="text-[#c4a456] font-semibold">Create account</button>
        </div>
      </div>
    </div>
  );
};

export default Login;