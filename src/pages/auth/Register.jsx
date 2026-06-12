import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronRight, MapPin } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { registerUser } from '../../services/api';

const Register = () => {
  const [role, setRole] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '' 
  });
  const navigate = useNavigate();

  const getUserCoordinates = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn("Geolocator missing from browser profile.");
        return resolve(null);
      }

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          resolve({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
          });
        },
        (error) => {
          setIsLocating(false);
          console.warn(`Location collection omitted: ${error.message}`);
          resolve(null); 
        },
        { timeout: 6000 }
      );
    });
  };

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
    
    const coords = await getUserCoordinates();

    const payload = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      password: formData.password,
      role: role,
      ...(coords && { longitude: coords.longitude, latitude: coords.latitude })
    };

    try {
      await registerUser(payload);
      alert("Account created! Please check your email to verify.");
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    const coords = await getUserCoordinates();
    
    try {
      const res = await axios.post('http://localhost:5000/api/auth/google-login', {
        idToken: credentialResponse.credential,
        role: role,
        ...(coords && { longitude: coords.longitude, latitude: coords.latitude })
      });

      if (res.data.token) {
        processAuthenticationSuccess(res.data.token, res.data.result);
      }
    } catch (err) {
      console.error("Google Auth Node Fail:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Google Social registration failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[750px]">
        
        {/* Left Side Branding */}
        <div className="w-full md:w-5/12 bg-[#0f2a29] p-12 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#0f2a29] font-bold text-2xl mb-8">N</div>
            <h2 className="text-3xl font-bold mb-4">
              {role === 'customer' ? 'Join the Community' : 'Open Your Shop'}
            </h2>
            <p className="text-white/60 text-sm">
              {role === 'customer' ? 'Discover curated products and track your orders.' : 'Reach thousands of customers today.'}
            </p>
          </div>
          
          <div className="space-y-3">
            <div className={`flex items-center gap-2 p-3.5 rounded-2xl border text-xs font-medium transition-all duration-3xl ${
              isLocating 
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' 
                : 'bg-white/5 border-white/10 text-white/70'
            }`}>
              <MapPin size={16} className={isLocating ? 'animate-bounce text-yellow-400' : 'text-slate-400'} />
              <span>{isLocating ? 'Synchronizing geolocation payload context...' : 'Location mapping active on request'}</span>
            </div>

            <div className="bg-white/10 p-6 rounded-3xl border border-white/10">
              <p className="text-xs font-bold text-[#c4a456] uppercase mb-2">Pro Tip</p>
              <p className="text-xs">Allow location permission access when your browser requests it to see products near you instantly.</p>
            </div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="w-full md:w-7/12 p-12 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-md mx-auto w-full">
            <h1 className="text-3xl font-black text-slate-900 mb-4">Create Account</h1>
            
            {/* Role Toggle */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button 
                type="button"
                onClick={() => setRole('customer')} 
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${role === 'customer' ? 'bg-white shadow-sm text-[#0f2a29]' : 'text-slate-500'}`}
              >
                Customer Account
              </button>
              <button 
                type="button"
                onClick={() => setRole('vendor')} 
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${role === 'vendor' ? 'bg-white shadow-sm text-[#0f2a29]' : 'text-slate-500'}`}
              >
                Merchant Vendor
              </button>
            </div>

            {/* Instant Google Registration Handler Node */}
            <div className="w-full flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Identity platform mapping aborted.')}
                theme="outline"
                shape="pill"
                text="signup_with"
                width="380px"
              />
            </div>

            <div className="relative flex items-center justify-center py-2 mb-2">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-slate-400 text-[10px] uppercase tracking-widest font-bold">Or manual parameters</span>
              <div className="border-t border-slate-200 w-full"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
              
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="First Name" 
                  required 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:border-[#c4a456] transition-colors" 
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                />
                <input 
                  type="text" 
                  placeholder="Last Name" 
                  required 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:border-[#c4a456] transition-colors" 
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                />
              </div>
              
              <input 
                type="email" 
                placeholder="Email Address" 
                required 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:border-[#c4a456] transition-colors" 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />

              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  required 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:border-[#c4a456] transition-colors" 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button 
                type="submit"
                disabled={isLocating}
                className="w-full py-4 bg-[#c4a456] disabled:bg-slate-400 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 group hover:bg-[#b3934b] transition-all"
              >
                {isLocating ? 'Synchronizing GPS...' : `Register as ${role}`}
                {!isLocating && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
            
            <p className="text-center mt-6 text-sm text-slate-500">
              Already have an account? <button onClick={() => navigate('/login')} className="text-[#0f2a29] font-bold underline">Login</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;