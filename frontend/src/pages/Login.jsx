import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Validation helpers
const validateEmail = (email) => {
    if (!email || !email.trim()) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address.';
    return '';
};

const validatePassword = (password) => {
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    return '';
};

const Login = () => {
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        // Live validation
        let fieldError = '';
        if (name === 'email') fieldError = validateEmail(value);
        else if (name === 'password') fieldError = validatePassword(value);
        setErrors(prev => ({ ...prev, [name]: fieldError }));
        setSubmitError('');
    };

    const validateAll = () => {
        const newErrors = {
            email: validateEmail(form.email),
            password: validatePassword(form.password),
        };
        setErrors(newErrors);
        return Object.values(newErrors).every(e => !e);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!validateAll()) return;

        setLoading(true);
        try {
            const res = await axios.post(
                `${BACKEND_URL}/api/v1/users/login`,
                { email: form.email.trim().toLowerCase(), password: form.password },
                { withCredentials: true }
            );

            const user = res.data.data.user;
            localStorage.setItem('accessToken', res.data.data.accessToken);
            signIn(user);

            if (user.role === 'volunteer') {
                navigate('/volunteer', { state: { userType: 'volunteer' } });
            } else if (user.role === 'admin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setSubmitError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${BACKEND_URL}/api/v1/auth/google`;
    };

    const FieldError = ({ field }) =>
        errors[field] ? (
            <span className="field-error" role="alert">
                <AlertCircle size={13} /> {errors[field]}
            </span>
        ) : null;

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

                        {submitError && (
                            <div className="submit-error-banner" role="alert">
                                <AlertCircle size={16} /> {submitError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            {/* Email */}
                            <div className={`form-field-container ${errors.email ? 'has-error' : ''}`}>
                                <label className="form-label">Email Address</label>
                                <div className="input-group">
                                    <Mail size={20} className="input-icon" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        className="input-field"
                                        autoComplete="email"
                                        aria-invalid={!!errors.email}
                                    />
                                </div>
                                <FieldError field="email" />
                            </div>

                            {/* Password */}
                            <div className={`form-field-container ${errors.password ? 'has-error' : ''}`}>
                                <label className="form-label">Password</label>
                                <div className="input-group">
                                    <Lock size={20} className="input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        className="input-field"
                                        autoComplete="current-password"
                                        aria-invalid={!!errors.password}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="password-toggle-btn"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <FieldError field="password" />
                            </div>

                            {/* Remember & Forgot */}
                            <div className="flex-row justify-between align-center mb-4">
                                <label className="checkbox-label">
                                    <input type="checkbox" className="checkbox-input" />
                                    Remember me
                                </label>
                                <Link to="/forgot-password" className="link-button">
                                    Forgot Password?
                                </Link>
                            </div>

                            {/* Submit */}
                            <button type="submit" className="login-btn" disabled={loading}>
                                {loading ? 'Signing In...' : 'Sign In'}
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