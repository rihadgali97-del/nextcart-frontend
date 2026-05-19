import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ChevronRight } from 'lucide-react';
import { loginUser } from '../../services/api';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  try {
    const response = await loginUser(formData);
    const data = response.data; // Ensure we are looking at the actual data object

    // DEBUGGING: This will tell us EXACTLY what the backend sent
    console.log("Full Backend Response:", data);

    // Look for the user object. Backends vary: some use .result, some .user, some .data
    const userData = data.result || data.user || data.data;

    if (data.token && userData) {
      localStorage.setItem('token', data.token);
      
      // Normalize the role to lowercase to prevent matching bugs
      const normalizedUser = {
        ...userData,
        role: userData.role ? userData.role.toLowerCase() : 'customer'
      };

      localStorage.setItem('user', JSON.stringify(normalizedUser));

      // THE PERFECT REDIRECT: Use the role directly from the freshly normalized data
      if (normalizedUser.role === 'admin') {
        window.location.href = '/admin';
      } else if (normalizedUser.role === 'vendor') {
        window.location.href = '/vendor/dashboard';
      } else {
        window.location.href = '/settings';
      }
    } else {
      setError("Login successful, but user data was missing from the server.");
    }
  } catch (err) {
    console.error("Login Error:", err);
    setError(err.response?.data?.message || "Login failed. Check your connection.");
  }
};

  return (
    <div className="min-h-screen bg-[#0a1a19] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[700px]">
        {/* Left Side - Branding */}
        <div className="w-full md:w-5/12 bg-[#0f2a29] p-12 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#0f2a29] font-bold text-2xl mb-8">N</div>
            <h2 className="text-3xl font-bold leading-tight mb-4">Welcome Back to NextCart</h2>
            <p className="text-white/60 text-sm leading-relaxed">Manage your sales and inventory in one professional dashboard.</p>
          </div>
          <img src="https://illustrations.popsy.co/white/creative-work.svg" alt="Login" className="w-64 opacity-80 mx-auto" />
          <p className="text-[10px] text-white/30 text-center uppercase tracking-widest">© 2026 NextCart System</p>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-7/12 p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Sign In</h1>
            <p className="text-slate-400 text-sm mb-10">Please enter your credentials</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
              
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c4a456]" size={18} />
                <input 
                  type="email" 
                  placeholder="Email" 
                  required 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20 transition-all" 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c4a456]" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  required 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20 transition-all"
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#c4a456]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" className="w-full py-4 bg-[#c4a456] text-white font-bold rounded-2xl shadow-lg hover:bg-opacity-90 flex items-center justify-center gap-2 group transition-all">
                Sign In <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className="text-center text-slate-500 text-xs mt-8">
                New here? <button type="button" onClick={() => navigate('/register')} className="text-[#c4a456] font-bold hover:underline">Create Account</button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;