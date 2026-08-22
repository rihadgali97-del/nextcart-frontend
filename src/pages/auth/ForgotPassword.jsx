import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { forgotPassword } from '../../services/api';
import Logo from '../../components/common/Logo';
import '../../styles/auth/forgot-password.css';

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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Logo className="h-10 mx-auto" showText={false} />
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-description">Enter your email and we will send a secure reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="auth-alert auth-alert--error">{error}</p>}
          {message && <p className="auth-alert auth-alert--success">{message}</p>}

          <div className="auth-input-group">
            <Mail className="auth-input-icon" size={18} />
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              className="auth-input auth-input--with-left"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="auth-primary-button">
            {isSubmitting ? 'Sending reset link...' : 'Send Reset Link'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="auth-back-link"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
