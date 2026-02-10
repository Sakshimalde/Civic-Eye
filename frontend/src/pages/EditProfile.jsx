import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, MapPin, FileText, ArrowLeft, Save } from 'lucide-react';
import './EditProfile.css';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const EditProfile = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    // Initialize form data with user data or defaults
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        location: user?.location || '',
        bio: user?.bio || ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${BACKEND_URL}/api/v1/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                const updatedUser = result.data;
                updateUser(updatedUser);
                alert('Profile updated successfully!');
                navigate(user?.role === 'volunteer' ? '/volunteer-profile' : user?.role === 'admin' ? '/AdminProfile' : '/profile');
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    };

    const handleCancel = () => {
        navigate(user?.role === 'volunteer' ? '/volunteer-profile' : user?.role === 'admin' ? '/AdminProfile' : '/profile');
    };

    return (
        <div className="edit-profile-page">
            {/* Header */}
            <header className="header-top">
                <div className="logo-section">
                    
                    <div className="logo-text">CivicEye</div>
                </div>
                <nav className="nav-links">
                    <Link to={user?.role === 'volunteer' ? '/volunteer' : user?.role === 'admin' ? '/admin-dashboard' : '/dashboard'}>Dashboard</Link>
                    <Link to={user?.role === 'volunteer' ? '/MyAssignedIssues' : user?.role === 'admin' ? '/admin-all-issues' : '/browse-issues'}>Browse Issues</Link>
                    <Link to="/report-issue">Report Issue</Link>
                </nav>
                <div className="user-profile">
                    <Link to={user?.role === 'volunteer' ? '/volunteer-profile' : user?.role === 'admin' ? '/AdminProfile' : '/profile'} className="profile-link">
                        <div className="user-initials">
                            {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'SW'}
                        </div>
                        <span className="user-name">{user?.name || 'Sarah Wilson'}</span>
                    </Link>
                </div>
            </header>

            {/* Title Section */}
            <div className="edit-profile-header">
                <h1 className="profile-title">Personal Information</h1>
                <p className="update-text">Update your profile information</p>
            </div>

            {/* Main Content */}
            <div className="edit-profile-container">
                <div className="profile-right">
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="name">
                                <User size={16} /> Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                <Mail size={16} /> Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">
                                <Phone size={16} /> Phone Number
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="location">
                                <MapPin size={16} /> Location
                            </label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="Enter your location"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="bio">
                                <FileText size={16} /> Bio
                            </label>
                            <textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                placeholder="Tell us about yourself and your volunteer work..."
                                rows="4"
                            />
                        </div>

                        <div className="button-group">
                            <button type="submit" className="save-btn">
                                <Save size={16} /> Save Changes
                            </button>
                            <button type="button" onClick={handleCancel} className="cancel-btn">
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
