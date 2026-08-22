import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { googleAuth, registerUser } from '../../services/api';
import Logo from '../../components/common/Logo';
import '../../styles/auth/register.css';

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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Logo className="h-10 mx-auto" showText={false} />
        </div>

        <div className="auth-role-selector">
          <button type="button" onClick={() => setRole('customer')} className={`auth-role-button ${role === 'customer' ? 'auth-role-button--active' : ''}`}>Customer</button>
          <button type="button" onClick={() => setRole('vendor')} className={`auth-role-button ${role === 'vendor' ? 'auth-role-button--active' : ''}`}>Vendor</button>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="text-sm text-slate-500">Join GebeyaPlus — create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="auth-alert auth-alert--error">{error}</p>}

          <div className="auth-name-grid">
            <input
              type="text"
              placeholder="First name"
              required
              className="auth-input"
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            />
            <input
              type="text"
              placeholder="Last name"
              required
              className="auth-input"
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            />
          </div>

          <input
            type="email"
            placeholder="Email address"
            required
            className="auth-input"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />

          <div className="auth-input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              className="auth-input auth-input--with-right"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-password-toggle">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Conditionally rendered fields for Vendors */}
          {role === 'vendor' && (
            <div className="auth-vendor-fields">
              <p className="auth-vendor-label">Verification Details</p>
              <input
                type="text"
                placeholder="National Fayda ID Number"
                required={role === 'vendor'}
                className="auth-input"
                onChange={(e) => setFormData({...formData, faydaNumber: e.target.value})}
              />
              <input
                type="text"
                placeholder="Trade / Business License Number"
                required={role === 'vendor'}
                className="auth-input"
                onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
              />
            </div>
          )}

          <button type="submit" disabled={isLocating || isSubmitting} className="auth-primary-button">
            {isLocating ? 'Synchronizing GPS...' : isSubmitting ? 'Creating account...' : `Register as ${role}`}
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
            onError={() => setError('Google Identity platform mapping aborted.')}
            theme="outline"
            shape="pill"
            text="signup_with"
            width="280px"
          />
        </div>

        <p className="auth-footer">
          Already have an account? <button onClick={() => navigate('/login')} className="auth-link auth-link--dark">Login</button>
        </p>
      </div>
    </div>
  );
};

export default Register;
