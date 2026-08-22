import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { resetPassword } from '../../services/api';
import Logo from '../../components/common/Logo';
import '../../styles/auth/reset-password.css';

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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Logo className="h-10 mx-auto" showText={false} />
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Create New Password</h1>
          <p className="auth-description">Choose a password with at least 8 characters.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="auth-alert auth-alert--error">{error}</p>}
          {message && <p className="auth-alert auth-alert--success">{message}</p>}

          <div className="auth-input-group">
            <Lock className="auth-input-icon" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              required
              minLength={8}
              value={formData.password}
              className="auth-input auth-input--with-left auth-input--with-right"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-password-toggle">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="auth-input-group">
            <Lock className="auth-input-icon" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              required
              minLength={8}
              value={formData.confirmPassword}
              className="auth-input auth-input--with-left"
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="auth-primary-button">
            {isSubmitting ? 'Updating password...' : 'Update Password'}
          </button>
        </form>

        <p className="auth-footer auth-footer--spaced">
          Remembered your password? <button type="button" onClick={() => navigate('/login')} className="auth-link">Sign in</button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
