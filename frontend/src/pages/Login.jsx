import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle login submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/v1/users/login`,
        form,
        { withCredentials: true }
      );

      const user = res.data.data.user;
      localStorage.setItem('accessToken', res.data.data.accessToken);
      signIn(user);

      alert('Login Successful!');

      // Redirect based on role
      if (user.role === 'volunteer') {
        navigate('/volunteer', { state: { userType: 'volunteer' } });
      } else if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred during login.');
    }
  };

  // Forgot password
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  // Google OAuth login
  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/v1/auth/google`;
  };

  return (
    <div className="login-page-container">
      {/* Header */}
      <header className="header-top">
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/help">Help</Link>
          <Link to="/about">About</Link>
        </nav>

        <div className="auth-buttons">
          <button onClick={() => navigate('/login')} className="sign-in-btn">
            Sign In <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate('/signup')} className="get-started-btn">
            Get Started
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="login-main-content">
        {/* Left Panel */}
        <div className="login-panel left-panel">
          <div className="form-card">
            <h2 className="welcome-title">Sign In</h2>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="form-field-container">
                <label className="form-label">Email Address</label>
                <div className="input-group">
                  <Mail size={20} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-field-container">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <Lock size={20} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex-row justify-between align-center mb-4">
                <label className="checkbox-label">
                  <input type="checkbox" className="checkbox-input" />
                  Remember me
                </label>

                <button
                  type="button"
                  className="link-button"
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit */}
              <button type="submit" className="login-btn">
                Sign In
              </button>

              {/* Divider */}
              <div className="divider">
                <span>or continue with</span>
              </div>

              {/* Google Login */}
              <button
                type="button"
                className="social-google-btn"
                onClick={handleGoogleLogin}
              >
                <FcGoogle size={20} />
                Sign in with Google
              </button>

              {/* Signup */}
              <div className="create-account-link-container">
                Don&apos;t have an account? <Link to="/signup">Create Account</Link>
              </div>
            </form>
          </div>
        </div>

        {/* Right Panel */}
        <div className="login-panel right-panel">
          <div className="right-panel-content">
            <h2 className="right-panel-title">Welcome Back!</h2>
            <p className="right-panel-subtitle">
              Report civic issues, track progress, and help build a better community together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
