import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { googleAuth, loginUser } from '../../services/api';
import Logo from '../../components/common/Logo';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const role = 'customer';
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const getAuthErrorMessage = (err, fallback) => (
    err.response?.data?.message || err.response?.data?.error || fallback
  );

  const processAuthenticationSuccess = (dataBlock) => {
    const { token } = dataBlock;
    if (!token) {
      setError("Login successful, but the server did not send a token.");
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
    try {
      const response = await loginUser(formData);
      processAuthenticationSuccess(response.data);
    } catch (err) {
      console.error("Login Error:", err);
      setError(getAuthErrorMessage(err, "Login failed. Check your email and password."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setIsSubmitting(true);
    try {
      const res = await googleAuth({
        idToken: credentialResponse.credential,
        role: role
      });

      processAuthenticationSuccess(res.data);
    } catch (err) {
      console.error("Google Auth Node Fail:", err.response?.data || err.message);
      setError(getAuthErrorMessage(err, "Google sign-in failed."));
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

          <div className="flex justify-end">
            <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs font-semibold text-[#c4a456]">
              Forgot password?
            </button>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#c4a456] text-white font-semibold rounded-md disabled:opacity-70">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
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
