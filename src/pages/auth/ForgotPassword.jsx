import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { forgotPassword } from '../../services/api';
import Logo from '../../components/common/Logo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
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
    setIsSubmitting(true);

    try {
      const response = await forgotPassword({ email });
      setMessage(response.data?.message || 'If an account exists for that email, a password reset link has been sent.');
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Unable to send the reset link. Please try again.'));
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
          <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
          <p className="text-sm text-slate-500">Enter your email and we will send a secure reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-xs font-medium bg-red-50 p-2 rounded">{error}</p>}
          {message && <p className="text-emerald-700 text-xs font-medium bg-emerald-50 p-2 rounded">{message}</p>}

          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#c4a456] text-white font-semibold rounded-md disabled:opacity-70">
            {isSubmitting ? 'Sending reset link...' : 'Send Reset Link'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-[#0f2a29]"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
