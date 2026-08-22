import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { googleAuth, loginUser } from '../../services/api';
import Logo from '../../components/common/Logo';
import '../../styles/auth/login.css';

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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Logo className="h-10 mx-auto" showText={false} />
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-description">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="auth-alert auth-alert--error">{error}</p>}

          <div className="auth-input-group">
            <Mail className="auth-input-icon" size={18} />
            <input
              type="email"
              placeholder="Email"
              required
              className="auth-input auth-input--with-left"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="auth-input-group">
            <Lock className="auth-input-icon" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              className="auth-input auth-input--with-left auth-input--with-right"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-password-toggle">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="auth-link-row">
            <button type="button" onClick={() => navigate('/forgot-password')} className="auth-link">
              Forgot password?
            </button>
          </div>

          <button type="submit" disabled={isSubmitting} className="auth-primary-button">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-label">Or continue with</span>
          <div className="auth-divider-line" />
        </div>

        <div className="auth-google">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Identity verification flow cancelled.')}
            theme="outline"
            shape="pill"
            text="continue_with"
            width="280px"
          />
        </div>

        <div className="auth-footer">
          New here? <button type="button" onClick={() => navigate('/register')} className="auth-link">Create account</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
