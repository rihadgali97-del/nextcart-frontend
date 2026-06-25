import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { googleAuth, registerUser } from '../../services/api';
import Logo from '../../components/common/Logo';

const Register = () => {
  const [role, setRole] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '',
    // 🛠️ NEW: Vendor explicit registration fields
    faydaNumber: '',
    licenseNumber: ''
  });
  const navigate = useNavigate();

  const getAuthErrorMessage = (err, fallback) => (
    err.response?.data?.message || err.response?.data?.error || fallback
  );

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

  const processAuthenticationSuccess = (dataBlock) => {
    const { token } = dataBlock;
    if (!token) {
      setError("Authentication succeeded, but the server did not send a token.");
      return;
    }

    localStorage.setItem('token', token);
    const userData = dataBlock.result || dataBlock.user || dataBlock.data || dataBlock;
    
    const normalizedUser = {
      ...userData,
      role: userData.role ? userData.role.toLowerCase() : 'customer'
    };

    localStorage.setItem('user', JSON.stringify(normalizedUser));

    if (normalizedUser.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (normalizedUser.role === 'vendor') {
      navigate('/vendor', { replace: true });
    } else {
      navigate('/customer', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const coords = await getUserCoordinates();

    const payload = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      password: formData.password,
      role: role,
      ...(coords && { longitude: coords.longitude, latitude: coords.latitude }),
      // 🛠️ NEW: Include conditionally if vendor is selected
      ...(role === 'vendor' && {
        faydaNumber: formData.faydaNumber,
        licenseNumber: formData.licenseNumber
      })
    };

    try {
      await registerUser(payload);
      alert("Account created! Please check your email to verify.");
      navigate('/login');
    } catch (err) {
      setError(getAuthErrorMessage(err, "Registration failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    const coords = await getUserCoordinates();
    setIsSubmitting(true);
    
    try {
      const res = await googleAuth({
        idToken: credentialResponse.credential,
        role: role,
        ...(coords && { longitude: coords.longitude, latitude: coords.latitude }),
        // 🛠️ NEW: Add strings for tracking during OAuth route signup if applicable
        ...(role === 'vendor' && {
          faydaNumber: formData.faydaNumber,
          licenseNumber: formData.licenseNumber
        })
      });

      processAuthenticationSuccess(res.data);
    } catch (err) {
      console.error("Google Auth Node Fail:", err.response?.data || err.message);
      setError(getAuthErrorMessage(err, "Google registration failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-8">
        <div className="mb-4">
          <Logo className="h-10 mx-auto" showText={false} />
        </div>

        <div className="flex justify-center gap-3 mb-4">
          <button type="button" onClick={() => setRole('customer')} className={`px-3 py-2 rounded-md text-sm font-semibold ${role === 'customer' ? 'bg-[#c4a456] text-white' : 'bg-slate-50 text-slate-600'}`}>Customer</button>
          <button type="button" onClick={() => setRole('vendor')} className={`px-3 py-2 rounded-md text-sm font-semibold ${role === 'vendor' ? 'bg-[#c4a456] text-white' : 'bg-slate-50 text-slate-600'}`}>Vendor</button>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="text-sm text-slate-500">Join NextCart — create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-xs font-medium bg-red-50 p-2 rounded">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="First name"
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20"
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            />
            <input
              type="text"
              placeholder="Last name"
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20"
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            />
          </div>

          <input
            type="email"
            placeholder="Email address"
            required
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* 🛠️ NEW: Conditionally rendered fields for Vendors */}
          {role === 'vendor' && (
            <div className="space-y-4 pt-1 border-t border-slate-100 animate-fadeIn">
              <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Verification Details</p>
              <input
                type="text"
                placeholder="National Fayda ID Number"
                required={role === 'vendor'}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20"
                onChange={(e) => setFormData({...formData, faydaNumber: e.target.value})}
              />
              <input
                type="text"
                placeholder="Trade / Business License Number"
                required={role === 'vendor'}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20"
                onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
              />
            </div>
          )}

          <button type="submit" disabled={isLocating || isSubmitting} className="w-full py-3 bg-[#c4a456] text-white font-semibold rounded-md disabled:opacity-70">
            {isLocating ? 'Synchronizing GPS...' : isSubmitting ? 'Creating account...' : `Register as ${role}`}
          </button>
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
            onError={() => setError('Google Identity platform mapping aborted.')}
            theme="outline"
            shape="pill"
            text="signup_with"
            width="280px"
          />
        </div>

        <p className="text-center text-sm text-slate-500">
          Already have an account? <button onClick={() => navigate('/login')} className="text-[#0f2a29] font-semibold">Login</button>
        </p>
      </div>
    </div>
  );
};

export default Register;