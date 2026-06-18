import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { resetPassword } from '../../services/api';
import Logo from '../../components/common/Logo';

const ResetPassword = () => {
  const { token } = useParams();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const getAuthErrorMessage = (err, fallback) => (
    err.response?.data?.message || err.response?.data?.error || fallback
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('This reset link is missing a token. Please request a new link.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await resetPassword(token, { password: formData.password });
      setMessage(response.data?.message || 'Password reset successful. You can now sign in.');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'This reset link is invalid or expired.'));
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
          <h1 className="text-2xl font-bold text-slate-900">Create New Password</h1>
          <p className="text-sm text-slate-500">Choose a password with at least 8 characters.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-xs font-medium bg-red-50 p-2 rounded">{error}</p>}
          {message && <p className="text-emerald-700 text-xs font-medium bg-emerald-50 p-2 rounded">{message}</p>}

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              required
              minLength={8}
              value={formData.password}
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              required
              minLength={8}
              value={formData.confirmPassword}
              className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20"
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#c4a456] text-white font-semibold rounded-md disabled:opacity-70">
            {isSubmitting ? 'Updating password...' : 'Update Password'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Remembered your password? <button type="button" onClick={() => navigate('/login')} className="text-[#c4a456] font-semibold">Sign in</button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
