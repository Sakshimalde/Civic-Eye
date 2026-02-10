import axios from 'axios';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import './SignUp.css';
import { ArrowRight } from "lucide-react";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SignUp = () => {
    const navigate = useNavigate();

    const handleSignIn = () => navigate("/login");
    const handleGetStarted = () => navigate("/signup");

    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        location: '',
        role: null,
        profilePhoto: null,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
    });

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'profilePhoto') {
            const file = files[0];
            if (file) {
                const renamedFile = new File(
                    [file],
                    `user-${Date.now()}.${file.name.split('.').pop()}`,
                    { type: file.type }
                );
                setForm((prev) => ({ ...prev, profilePhoto: renamedFile }));
            }
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
            if (name === 'password') validatePassword(value);
        }
    };

    // Validate password strength
    const validatePassword = (password) => {
        setPasswordStrength({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
        });
    };

    // Step navigation
    const handleNextStep = (e) => {
        e.preventDefault();
        if (step === 1) {
            if (form.name && form.email) setStep(2);
            else alert('Please fill in all required fields.');
        } else if (step === 2) {
            if (
                form.password === form.confirmPassword &&
                passwordStrength.length &&
                passwordStrength.uppercase &&
                passwordStrength.lowercase &&
                passwordStrength.number
            )
                setStep(3);
            else alert('Passwords must match and meet strength requirements.');
        } else if (step === 3) {
            if (form.role) {
                handleSubmit(e);
            } else {
                alert('Please select a role.');
            }
        }
    };

    // Submit registration with role-based redirect
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('email', form.email);
            formData.append('password', form.password);
            formData.append('location', form.location);
            formData.append('role', form.role);
            if (form.profilePhoto) formData.append('profilePhoto', form.profilePhoto);

            console.log('Submitting formData:', formData);

            const res = await axios.post(
                `${BACKEND_URL}/api/v1/users/register`,
                formData,
                { withCredentials: true }
            );

            console.log('Registration response:', res.data);
            
            // Store user data in localStorage
            localStorage.setItem('userRole', form.role);
            localStorage.setItem('userName', form.name);
            localStorage.setItem('userEmail', form.email);
            localStorage.setItem('userLocation', form.location);
            
            // Optional: Store token if backend sends it
            if (res.data.token) {
                localStorage.setItem('authToken', res.data.token);
            }

            alert(res.data.message || 'Registration Successful!');
            
            // Redirect based on role
            if (form.role === 'volunteer') {
                navigate('/login');
            } else if (form.role === 'admin') {
                navigate('/login');
            } else if (form.role === 'user') {
                navigate('/login');
            } else {
                // Default fallback
                navigate('/');
            }
            
        } catch (err) {
            const serverData = err.response?.data;
            const serverMessage =
                typeof serverData === 'string' ? serverData : serverData?.message;
            console.error('Registration error:', serverData || err);
            alert(
                serverMessage || err.message || 'Error occurred during registration'
            );
        }
    };

    // Render steps
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <div className="form-step">
                            <div className="input-group">
                                <i className="input-icon">👤</i>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Full Name"
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="input-group">
                                <i className="input-icon">✉️</i>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Email Address"
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="input-group">
                                <i className="input-icon">📞</i>
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Phone Number (Optional)"
                                    className="input-field"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleNextStep}
                            className="button-primary"
                        >
                            Continue to Security
                        </button>
                    </>
                );
            case 2:
                const passwordStrengthProgress = (Object.values(passwordStrength).filter(Boolean).length / 4) * 100;
                let strengthLabel = 'Weak';
                if (passwordStrengthProgress > 25) strengthLabel = 'Fair';
                if (passwordStrengthProgress > 75) strengthLabel = 'Strong';
                
                return (
                    <>
                        <div className="form-step">
                            <div className="input-group">
                                <i className="input-icon">🔐</i>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Create Password"
                                    required
                                    className="input-field"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '👁️' : '🔒'}
                                </button>
                            </div>
                            <div className="password-strength-container">
                                <div className="strength-bar-label">Password Strength</div>
                                <div className="strength-bar">
                                    <div className="strength-bar-fill" style={{ width: `${passwordStrengthProgress}%` }}></div>
                                </div>
                                <div className="strength-label" style={{ color: passwordStrengthProgress < 50 ? '#e53e3e' : '#38a169' }}>
                                    {strengthLabel}
                                </div>
                            </div>
                            <div className="password-strength-checks">
                                <p className={passwordStrength.length ? 'met' : 'unmet'}>
                                    <i className="check-icon">{passwordStrength.length ? '✔' : '⚪'}</i>8+ characters
                                </p>
                                <p className={passwordStrength.uppercase ? 'met' : 'unmet'}>
                                    <i className="check-icon">{passwordStrength.uppercase ? '✔' : '⚪'}</i>Uppercase
                                </p>
                                <p className={passwordStrength.lowercase ? 'met' : 'unmet'}>
                                    <i className="check-icon">{passwordStrength.lowercase ? '✔' : '⚪'}</i>Lowercase
                                </p>
                                <p className={passwordStrength.number ? 'met' : 'unmet'}>
                                    <i className="check-icon">{passwordStrength.number ? '✔' : '⚪'}</i>Number/Symbol
                                </p>
                            </div>
                            <div className="input-group">
                                <i className="input-icon">🔐</i>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm Password"
                                    required
                                    className="input-field"
                                />
                            </div>
                        </div>
                        <div className="button-group">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="button-secondary"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleNextStep}
                                className="button-primary"
                            >
                                Continue to Location
                            </button>
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <div className="form-step">
                            <div className="input-group">
                                <i className="input-icon">📍</i>
                                <input
                                    type="text"
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="Your City/Location"
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="role-container">
                                <div
                                    className={`role-option ${form.role === 'user' ? 'active' : ''}`}
                                    onClick={() => setForm((prev) => ({ ...prev, role: 'user' }))}
                                >
                                    <div className="role-info">
                                        <i className="role-icon">👤</i>
                                        <div className="role-text">
                                            <h3>Citizen</h3>
                                            <p>Report issues and vote on community problems</p>
                                        </div>
                                    </div>
                                    {form.role === 'user' && <i className="check-icon-active">✔️</i>}
                                </div>

                                <div
                                    className={`role-option ${form.role === 'volunteer' ? 'active' : ''}`}
                                    onClick={() => setForm((prev) => ({ ...prev, role: 'volunteer' }))}
                                >
                                    <div className="role-info">
                                        <i className="role-icon">💪</i>
                                        <div className="role-text">
                                            <h3>Volunteer</h3>
                                            <p>Help resolve issues and assist the community</p>
                                        </div>
                                    </div>
                                    {form.role === 'volunteer' && <i className="check-icon-active">✔️</i>}
                                </div>
                                
                                <div
                                    className={`role-option ${form.role === 'admin' ? 'active' : ''}`}
                                    onClick={() => setForm((prev) => ({ ...prev, role: 'admin' }))}
                                >
                                    <div className="role-info">
                                        <i className="role-icon">👑</i>
                                        <div className="role-text">
                                            <h3>Administrator</h3>
                                            <p>Manage the platform and oversee operations</p>
                                        </div>
                                    </div>
                                    {form.role === 'admin' && <i className="check-icon-active">✔️</i>}
                                </div>
                            </div>
                            <div className="terms-checkbox">
                                <input type="checkbox" id="terms" required />
                                <label htmlFor="terms">
                                    I agree to the <a href="/">Terms of Service</a> and{' '}
                                    <a href="/">Privacy Policy</a>
                                </label>
                            </div>
                        </div>
                        <div className="button-group">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="button-secondary"
                            >
                                Back
                            </button>
                            <button type="submit" onClick={handleNextStep} className="button-primary">
                                Register
                            </button>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="header-top">
                
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/help">Help</Link>
                    <Link to="/about">About</Link>
                </div>
                <div className="auth-buttons">
                    <button onClick={handleSignIn} className="sign-in-btn">
                        Sign In <ArrowRight size={16} />
                    </button>
                    <button onClick={handleGetStarted} className="get-started-btn">Get Started</button>
                </div>
            </div>
            <div className="signup-page">
                <div className="signup-panel-left">
                    <div className="form-card">
                        <h1 className="form-title">Join CivicEye</h1>
                        <p className="form-subtitle">Help make your community cleaner and better</p>

                        <div className="progress-bar-container">
                            <div className="progress-line-fill" style={{ width: `${(step - 1) * 50}%` }}></div>
                            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}></div>
                            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}></div>
                            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}></div>
                        </div>
                        <p className="step-label">Step {step} of 3: {step === 1 ? 'Personal Information' : step === 2 ? 'Account Security' : 'Location & Role'}</p>
                        <form onSubmit={handleSubmit}>
                            {renderStep()}
                        </form>
                        <div className="login-link">
                            Already have an account? <Link to="/login">Sign In</Link>
                        </div>
                    </div>
                </div>
                <div className="signup-panel-right">
                    <div className="right-panel-content">
                        <h2 className="right-panel-title">Join Our Community!</h2>
                        <p className="right-panel-subtitle">
                            Sign up today to start reporting issues, tracking progress, and helping
                            your community thrive.
                        </p>
                        <div className="stats-container">
                            <div className="stat-item">
                                <div className="stat-value"></div>
                                <div className="stat-label"></div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value"></div>
                                <div className="stat-label"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignUp;