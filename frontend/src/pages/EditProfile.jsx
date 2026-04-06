import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, MapPin, FileText, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import './EditProfile.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Validation helpers
const validateName = (name) => {
    if (!name || name.trim().length < 2) return 'Full name must be at least 2 characters.';
    if (name.trim().length > 60) return 'Full name must not exceed 60 characters.';
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) return 'Name can only contain letters, spaces, hyphens, and apostrophes.';
    return '';
};

const validateEmail = (email) => {
    if (!email || !email.trim()) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address.';
    return '';
};

const validatePhone = (phone) => {
    if (!phone || !phone.trim()) return ''; // optional
    const cleaned = phone.replace(/[\s\-().+]/g, '');
    if (!/^\d{7,15}$/.test(cleaned)) return 'Phone number must be 7–15 digits.';
    return '';
};

const validateLocation = (location) => {
    if (!location || location.trim().length < 2) return 'Location must be at least 2 characters.';
    if (location.trim().length > 100) return 'Location must not exceed 100 characters.';
    return '';
};

const validateBio = (bio) => {
    if (bio && bio.length > 500) return 'Bio must not exceed 500 characters.';
    return '';
};

const EditProfile = () => {
    const { user, signIn } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        location: user?.location || '',
        bio: user?.bio || ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const getProfilePath = () => {
        if (user?.role === 'volunteer') return '/volunteer-profile';
        if (user?.role === 'admin') return '/AdminProfile';
        return '/profile';
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Live validation per field
        let fieldError = '';
        if (name === 'name') fieldError = validateName(value);
        else if (name === 'email') fieldError = validateEmail(value);
        else if (name === 'phone') fieldError = validatePhone(value);
        else if (name === 'location') fieldError = validateLocation(value);
        else if (name === 'bio') fieldError = validateBio(value);

        setErrors(prev => ({ ...prev, [name]: fieldError }));
        setSubmitError('');
    };

    const validateAll = () => {
        const newErrors = {
            name: validateName(formData.name),
            email: validateEmail(formData.email),
            phone: validatePhone(formData.phone),
            location: validateLocation(formData.location),
            bio: validateBio(formData.bio),
        };
        setErrors(newErrors);
        return Object.values(newErrors).every(e => !e);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!validateAll()) {
            setSubmitError('Please fix the errors above before saving.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/v1/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    phone: formData.phone.trim(),
                    location: formData.location.trim(),
                    bio: formData.bio.trim(),
                })
            });

            const result = await response.json();

            if (response.ok) {
                signIn(result.data);
                navigate(getProfilePath(), { state: { successMessage: 'Profile updated successfully!' } });
            } else {
                setSubmitError(result.message || 'Failed to update profile. Please try again.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setSubmitError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => navigate(getProfilePath());

    const FieldError = ({ field }) =>
        errors[field] ? (
            <span className="field-error" role="alert">
                <AlertCircle size={13} /> {errors[field]}
            </span>
        ) : null;

    return (
        <div className="edit-profile-page">
            {/* Header */}
            <header className="header-top">
                <div className="logo-section">
                    <div className="logo-text">CivicEye</div>
                </div>
                <nav className="nav-links">
                    <Link to={user?.role === 'volunteer' ? '/volunteer' : user?.role === 'admin' ? '/admin-dashboard' : '/dashboard'}>
                        Dashboard
                    </Link>
                    <Link to={user?.role === 'volunteer' ? '/MyAssignedIssues' : user?.role === 'admin' ? '/admin-all-issues' : '/browse-issues'}>
                        Browse Issues
                    </Link>
                    {user?.role !== 'admin' && <Link to="/report-issue">Report Issue</Link>}
                </nav>
                <div className="user-profile">
                    <Link to={getProfilePath()} className="profile-link">
                        <div className="user-initials">
                            {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                        </div>
                        <span className="user-name">{user?.name || 'User'}</span>
                    </Link>
                </div>
            </header>

            {/* Title */}
            <div className="edit-profile-header">
                <h1 className="profile-title">Edit Profile</h1>
                <p className="update-text">Update your personal information</p>
            </div>

            {/* Main Content */}
            <div className="edit-profile-container">
                <div className="profile-right">
                    {submitError && (
                        <div className="submit-error-banner" role="alert">
                            <AlertCircle size={16} /> {submitError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="profile-form" noValidate>
                        {/* Full Name */}
                        <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
                            <label htmlFor="name">
                                <User size={16} /> Full Name <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter your full name"
                                maxLength={60}
                                aria-describedby="name-error"
                                aria-invalid={!!errors.name}
                            />
                            <FieldError field="name" />
                        </div>

                        {/* Email */}
                        <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                            <label htmlFor="email">
                                <Mail size={16} /> Email Address <span className="required">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email address"
                                aria-invalid={!!errors.email}
                            />
                            <FieldError field="email" />
                        </div>

                        {/* Phone */}
                        <div className={`form-group ${errors.phone ? 'has-error' : ''}`}>
                            <label htmlFor="phone">
                                <Phone size={16} /> Phone Number <span className="optional">(Optional)</span>
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="e.g. +91 98765 43210"
                                maxLength={20}
                                aria-invalid={!!errors.phone}
                            />
                            <FieldError field="phone" />
                        </div>

                        {/* Location */}
                        <div className={`form-group ${errors.location ? 'has-error' : ''}`}>
                            <label htmlFor="location">
                                <MapPin size={16} /> Location <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="Enter your city or area"
                                maxLength={100}
                                aria-invalid={!!errors.location}
                            />
                            <FieldError field="location" />
                        </div>

                        {/* Bio */}
                        <div className={`form-group ${errors.bio ? 'has-error' : ''}`}>
                            <label htmlFor="bio">
                                <FileText size={16} /> Bio <span className="optional">(Optional)</span>
                            </label>
                            <textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                placeholder="Tell us a little about yourself..."
                                rows="4"
                                maxLength={500}
                                aria-invalid={!!errors.bio}
                            />
                            <div className="char-count">{formData.bio.length}/500</div>
                            <FieldError field="bio" />
                        </div>

                        <div className="button-group">
                            <button type="submit" className="save-btn" disabled={loading}>
                                <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button type="button" onClick={handleCancel} className="cancel-btn" disabled={loading}>
                                <ArrowLeft size={16} /> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;