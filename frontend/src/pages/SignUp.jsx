import axios from 'axios';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import './SignUp.css';
import { ArrowRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// ── Validation helpers ────────────────────────────────────────────────────────

const validateName = (name) => {
    if (!name || !name.trim()) return 'Full name is required.';
    if (name.trim().length < 2) return 'Name must be at least 2 characters.';
    if (name.trim().length > 60) return 'Name must not exceed 60 characters.';
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim()))
        return 'Name can only contain letters, spaces, hyphens, and apostrophes.';
    if (/^\s/.test(name) || /\s$/.test(name))
        return 'Name must not start or end with a space.';
    return '';
};

const validateEmail = (email) => {
    if (!email || !email.trim()) return 'Email address is required.';
    const trimmed = email.trim().toLowerCase();
    const strictEmailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!strictEmailRegex.test(trimmed))
        return 'Enter a valid email address (e.g. name@gmail.com).';
    const domain = trimmed.split('@')[1];
    const blockedDomains = ['test.com', 'example.com', 'fake.com', 'abc.com', 'xyz.com'];
    if (blockedDomains.includes(domain))
        return 'Please use a real email address.';
    return '';
};

const validatePhone = (phone) => {
    if (!phone || !phone.trim()) return 'Phone number is required.';
    const cleaned = phone.trim().replace(/[\s\-().+]/g, '');
    if (!/^\d+$/.test(cleaned)) return 'Phone number can only contain digits, spaces, +, -, ( ).';
    if (cleaned.length < 7) return 'Phone number is too short (minimum 7 digits).';
    if (cleaned.length > 15) return 'Phone number is too long (maximum 15 digits).';
    if (cleaned.length === 10 && !/^[6-9]/.test(cleaned))
        return 'Indian mobile numbers must start with 6, 7, 8, or 9.';
    return '';
};

const validatePasswordRules = (password) => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
});

const validatePassword = (password) => {
    if (!password) return 'Password is required.';
    const r = validatePasswordRules(password);
    if (!r.length) return 'Password must be at least 8 characters.';
    if (!r.uppercase) return 'Password must include at least one uppercase letter (A-Z).';
    if (!r.lowercase) return 'Password must include at least one lowercase letter (a-z).';
    if (!r.number) return 'Password must include at least one number (0-9).';
    return '';
};

const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) return 'Please confirm your password.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
};

const validateLocation = (location) => {
    if (!location || !location.trim()) return 'Location is required.';
    if (location.trim().length < 2) return 'Location must be at least 2 characters.';
    if (location.trim().length > 100) return 'Location must not exceed 100 characters.';
    return '';
};

const FieldError = ({ message }) =>
    message ? (
        <span className="field-error" role="alert">
            <AlertCircle size={13} /> {message}
        </span>
    ) : null;

// ─────────────────────────────────────────────────────────────────────────────

const SignUp = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: '', email: '', phone: '',
        password: '', confirmPassword: '',
        location: '', role: null, profilePhoto: null,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [stepError, setStepError] = useState('');
    const [loading, setLoading] = useState(false);

    const passwordRules = validatePasswordRules(form.password);
    const passwordStrengthScore = Object.values(passwordRules).filter(Boolean).length;
    const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][passwordStrengthScore];
    const strengthColor = passwordStrengthScore <= 2 ? '#e53e3e' : passwordStrengthScore <= 3 ? '#ed8936' : '#38a169';
    const strengthPercent = (passwordStrengthScore / 5) * 100;

    const getFieldError = (name, value) => {
        if (name === 'name') return validateName(value);
        if (name === 'email') return validateEmail(value);
        if (name === 'phone') return validatePhone(value);
        if (name === 'password') return validatePassword(value);
        if (name === 'confirmPassword') return validateConfirmPassword(form.password, value);
        if (name === 'location') return validateLocation(value);
        return '';
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'profilePhoto') {
            const file = files[0];
            if (file) {
                if (!file.type.startsWith('image/')) { setErrors(p => ({ ...p, profilePhoto: 'Only image files are allowed.' })); return; }
                if (file.size > 5 * 1024 * 1024) { setErrors(p => ({ ...p, profilePhoto: 'Profile photo must be under 5MB.' })); return; }
                const renamed = new File([file], `user-${Date.now()}.${file.name.split('.').pop()}`, { type: file.type });
                setForm(p => ({ ...p, profilePhoto: renamed }));
                setErrors(p => ({ ...p, profilePhoto: '' }));
            }
            return;
        }

        setForm(prev => ({ ...prev, [name]: value }));
        setStepError('');

        if (touched[name]) {
            const fieldError = getFieldError(name, value);
            if (name === 'password' && touched.confirmPassword) {
                setErrors(prev => ({ ...prev, [name]: fieldError, confirmPassword: validateConfirmPassword(value, form.confirmPassword) }));
            } else {
                setErrors(prev => ({ ...prev, [name]: fieldError }));
            }
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: getFieldError(name, value) }));
    };

    const validateStep1 = () => {
        const newErrors = { name: validateName(form.name), email: validateEmail(form.email), phone: validatePhone(form.phone) };
        setTouched(prev => ({ ...prev, name: true, email: true, phone: true }));
        setErrors(prev => ({ ...prev, ...newErrors }));
        return Object.values(newErrors).every(e => !e);
    };

    const validateStep2 = () => {
        const newErrors = { password: validatePassword(form.password), confirmPassword: validateConfirmPassword(form.password, form.confirmPassword) };
        setTouched(prev => ({ ...prev, password: true, confirmPassword: true }));
        setErrors(prev => ({ ...prev, ...newErrors }));
        return Object.values(newErrors).every(e => !e);
    };

    const validateStep3 = () => {
        const newErrors = { location: validateLocation(form.location), role: form.role ? '' : 'Please select a role to continue.' };
        setTouched(prev => ({ ...prev, location: true }));
        setErrors(prev => ({ ...prev, ...newErrors }));
        return Object.values(newErrors).every(e => !e);
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        setStepError('');
        if (step === 1) { if (validateStep1()) setStep(2); else setStepError('Please fix the errors above to continue.'); }
        else if (step === 2) { if (validateStep2()) setStep(3); else setStepError('Please fix the errors above to continue.'); }
        else if (step === 3) { if (validateStep3()) handleSubmit(e); else setStepError('Please fix the errors above to register.'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', form.name.trim());
            formData.append('email', form.email.trim().toLowerCase());
            formData.append('password', form.password);
            formData.append('location', form.location.trim());
            formData.append('role', form.role);
            formData.append('phone', form.phone.trim());
            if (form.profilePhoto) formData.append('profilePhoto', form.profilePhoto);
            const res = await axios.post(`${BACKEND_URL}/api/v1/users/register`, formData, { withCredentials: true });
            alert(res.data.message || 'Registration successful! Please sign in.');
            navigate('/login');
        } catch (err) {
            const serverData = err.response?.data;
            const message = typeof serverData === 'string' ? serverData : serverData?.message;
            setStepError(message || err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step renderers ────────────────────────────────────────────────────────

    const inputState = (field) => {
        if (!touched[field]) return '';
        return errors[field] ? 'has-error' : form[field] ? 'is-valid' : '';
    };

    const renderStep1 = () => (
        <>
            <div className="form-step">

                {/* Full Name */}
                <div className={`input-wrapper ${inputState('name')}`}>
                    <div className="input-group">
                        <i className="input-icon">👤</i>
                        <input
                            type="text" name="name" value={form.name}
                            onChange={handleChange} onBlur={handleBlur}
                            placeholder="Full Name *" className="input-field"
                            maxLength={60} autoComplete="name"
                        />
                        {touched.name && !errors.name && form.name && <CheckCircle size={16} className="valid-icon" />}
                    </div>
                    {touched.name && <FieldError message={errors.name} />}
                </div>

                {/* Email */}
                <div className={`input-wrapper ${inputState('email')}`}>
                    <div className="input-group">
                        <i className="input-icon">✉️</i>
                        <input
                            type="email" name="email" value={form.email}
                            onChange={handleChange} onBlur={handleBlur}
                            placeholder="Email Address * (e.g. name@gmail.com)" className="input-field"
                            autoComplete="email"
                        />
                        {touched.email && !errors.email && form.email && <CheckCircle size={16} className="valid-icon" />}
                    </div>
                    {touched.email && <FieldError message={errors.email} />}
                </div>

                {/* Phone */}
                <div className={`input-wrapper ${inputState('phone')}`}>
                    <div className="input-group">
                        <i className="input-icon">📞</i>
                        <input
                            type="tel" name="phone" value={form.phone}
                            onChange={handleChange} onBlur={handleBlur}
                            placeholder="Phone Number * (e.g. 9876543210)" className="input-field"
                            maxLength={20} autoComplete="tel"
                        />
                        {touched.phone && !errors.phone && form.phone && <CheckCircle size={16} className="valid-icon" />}
                    </div>
                    {touched.phone && <FieldError message={errors.phone} />}
                </div>

            </div>
            <button type="button" onClick={handleNextStep} className="button-primary">
                Continue to Security
            </button>
        </>
    );

    const renderStep2 = () => (
        <>
            <div className="form-step">

                {/* Password */}
                <div className={`input-wrapper ${touched.password && errors.password ? 'has-error' : ''}`}>
                    <div className="input-group">
                        <i className="input-icon">🔐</i>
                        <input
                            type={showPassword ? 'text' : 'password'} name="password" value={form.password}
                            onChange={handleChange} onBlur={handleBlur}
                            placeholder="Create Password *" className="input-field"
                            autoComplete="new-password"
                        />
                        <button type="button" className="password-toggle" onClick={() => setShowPassword(p => !p)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}>
                            {showPassword ? '👁️' : '🔒'}
                        </button>
                    </div>
                    {touched.password && <FieldError message={errors.password} />}
                </div>

                {form.password && (
                    <div className="password-strength-container">
                        <div className="strength-bar-label">Password Strength</div>
                        <div className="strength-bar">
                            <div className="strength-bar-fill" style={{ width: `${strengthPercent}%`, backgroundColor: strengthColor }} />
                        </div>
                        <div className="strength-label" style={{ color: strengthColor }}>{strengthLabel}</div>
                    </div>
                )}

                <div className="password-strength-checks">
                    {[
                        { rule: passwordRules.length,    label: '8+ characters' },
                        { rule: passwordRules.uppercase, label: 'Uppercase letter (A-Z)' },
                        { rule: passwordRules.lowercase, label: 'Lowercase letter (a-z)' },
                        { rule: passwordRules.number,    label: 'Number (0-9)' },
                        { rule: passwordRules.special,   label: 'Special character (!@#$…)' },
                    ].map(({ rule, label }) => (
                        <p key={label} className={rule ? 'met' : 'unmet'}>
                            <i className="check-icon">{rule ? '✔' : '⚪'}</i> {label}
                        </p>
                    ))}
                </div>

                {/* Confirm Password */}
                <div className={`input-wrapper ${inputState('confirmPassword')}`}>
                    <div className="input-group">
                        <i className="input-icon">🔐</i>
                        <input
                            type="password" name="confirmPassword" value={form.confirmPassword}
                            onChange={handleChange} onBlur={handleBlur}
                            placeholder="Confirm Password *" className="input-field"
                            autoComplete="new-password"
                        />
                        {touched.confirmPassword && !errors.confirmPassword && form.confirmPassword && (
                            <CheckCircle size={16} className="valid-icon" />
                        )}
                    </div>
                    {touched.confirmPassword && <FieldError message={errors.confirmPassword} />}
                </div>

            </div>
            <div className="button-group">
                <button type="button" onClick={() => setStep(1)} className="button-secondary">Back</button>
                <button type="button" onClick={handleNextStep} className="button-primary">Continue to Location</button>
            </div>
        </>
    );

    const renderStep3 = () => (
        <>
            <div className="form-step">

                {/* Location */}
                <div className={`input-wrapper ${inputState('location')}`}>
                    <div className="input-group">
                        <i className="input-icon">📍</i>
                        <input
                            type="text" name="location" value={form.location}
                            onChange={handleChange} onBlur={handleBlur}
                            placeholder="Your City / Location *" className="input-field"
                            maxLength={100}
                        />
                        {touched.location && !errors.location && form.location && <CheckCircle size={16} className="valid-icon" />}
                    </div>
                    {touched.location && <FieldError message={errors.location} />}
                </div>

                {/* Role selection */}
                <div className="role-container">
                    {[
                        { value: 'user',      icon: '👤', title: 'Citizen',      desc: 'Report issues and vote on community problems' },
                        { value: 'volunteer', icon: '💪', title: 'Volunteer',     desc: 'Help resolve issues and assist the community' },
                        { value: 'admin',     icon: '👑', title: 'Administrator', desc: 'Manage the platform and oversee operations' },
                    ].map(({ value, icon, title, desc }) => (
                        <div
                            key={value}
                            className={`role-option ${form.role === value ? 'active' : ''}`}
                            onClick={() => { setForm(p => ({ ...p, role: value })); setErrors(p => ({ ...p, role: '' })); }}
                            role="button" tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setForm(p => ({ ...p, role: value }))}
                            aria-pressed={form.role === value}
                        >
                            <div className="role-info">
                                <i className="role-icon">{icon}</i>
                                <div className="role-text"><h3>{title}</h3><p>{desc}</p></div>
                            </div>
                            {form.role === value && <i className="check-icon-active">✔️</i>}
                        </div>
                    ))}
                </div>
                <FieldError message={errors.role} />

                <div className="terms-checkbox">
                    <input type="checkbox" id="terms" required />
                    <label htmlFor="terms">
                        I agree to the <a href="/">Terms of Service</a> and <a href="/">Privacy Policy</a>
                    </label>
                </div>

            </div>
            <div className="button-group">
                <button type="button" onClick={() => setStep(2)} className="button-secondary">Back</button>
                <button type="button" onClick={handleNextStep} className="button-primary" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </div>
        </>
    );

    return (
        <>
            <div className="header-top">
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/help">Help</Link>
                    <Link to="/about">About</Link>
                </div>
                <div className="auth-buttons">
                    <button onClick={() => navigate('/login')} className="sign-in-btn">Sign In <ArrowRight size={16} /></button>
                    <button onClick={() => navigate('/signup')} className="get-started-btn">Get Started</button>
                </div>
            </div>

            <div className="signup-page">
                <div className="signup-panel-left">
                    <div className="form-card">
                        <h1 className="form-title">Join CivicEye</h1>
                        <p className="form-subtitle">Help make your community cleaner and better</p>

                        <div className="progress-bar-container">
                            <div className="progress-line-fill" style={{ width: `${(step - 1) * 50}%` }} />
                            {[1, 2, 3].map(s => <div key={s} className={`progress-step ${step >= s ? 'active' : ''}`} />)}
                        </div>
                        <p className="step-label">
                            Step {step} of 3:{' '}
                            {step === 1 ? 'Personal Information' : step === 2 ? 'Account Security' : 'Location & Role'}
                        </p>

                        {stepError && (
                            <div className="submit-error-banner" role="alert">
                                <AlertCircle size={16} /> {stepError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
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
                            Sign up today to start reporting issues, tracking progress, and helping your community thrive.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignUp;