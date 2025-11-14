// src/pages/AdminProfile.jsx

import React, { useEffect } from 'react'; // Removed unused useState
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// All necessary icons imported
import { 
    User, Mail, MapPin, Briefcase, Award, Heart, CheckCircle, LogOut, Phone, Globe, ArrowRight, Edit3, 
    LayoutDashboard, AlertCircle, Users, FileText, Clock, Loader2 
} from 'lucide-react'; 
import './ProfilePage.css'; // Your custom CSS file

const AdminProfile = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    
    // --- Data Safety Check ---
    const mockUser = {
        name: user?.name || 'Michael Johnson',
        email: user?.email || 'admin@cleanstreet.com',
        role: user?.role || 'admin',
        createdAt: user?.createdAt || new Date().toISOString(),
        phone: user?.phone || '987-654-3210', 
        location: user?.location || 'Maharashtra, India',
        about: user?.about || 'Active community member passionate about improving our neighborhood. I believe in working together to create cleaner, safer streets for everyone.',
        isPremium: true,
        ...user 
    };

    // --- Logout and Redirect Logic ---
    useEffect(() => {
        // Redirect to login if user object is null (unauthenticated)
        if (user === null) { 
            navigate('/login');
        }
    }, [user, navigate]);

    const handleLogout = () => {
        axios.post('http://localhost:3000/api/v1/users/logout', {}, { withCredentials: true })
            .catch(() => {})
            .finally(() => {
                signOut();
                navigate('/'); 
            });
    };

    // --- Utility Functions ---
    const getUserInitials = (name) => {
        if (!name) return 'MJ'; // Default to MJ for Admin Profile
        const nameParts = name.split(' ');
        const initials = nameParts.map(part => part[0]).join('');
        return initials.toUpperCase();
    };

    const getJoinedDate = (dateString) => {
        if (!dateString) return 'Joined unknown date';
        const date = new Date(dateString);
        if (isNaN(date)) return 'Joined unknown date'; 
        return `Joined ${date.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
    };

    const username = mockUser.email ? mockUser.email.split('@')[0] : 'cleanstreeter';
    
    const InfoField = ({ icon: Icon, label, value }) => (
        <div className="info-item">
            <Icon size={20} />
            <div className="info-text-inline">
                <span className="info-label">{label}:</span>
                <strong className="info-value">{value}</strong>
            </div>
        </div>
    );


    // --- Loading State Render (CRITICAL FIX) ---
    if (user === undefined) { 
        return (
            <div className="loading-state-profile" style={{ 
                minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', 
                flexDirection: 'column', fontSize: '1.2rem', color: '#4c66e4', backgroundColor: '#f7fafc' }}>
                <Loader2 size={36} className="loader-spin" style={{ animation: 'spin 1s linear infinite' }} />
                Authenticating user...
            </div>
        );
    }
    
    return (
        <>
            {/* --- Navigation Header --- */}
            <header className="header-top">
                <div className="logo-section">
                    
                    <div className="logo-text">CivicEye</div>
                </div>
                
                {/* FIX: Integrated Admin Navigation Links */}
                <nav className="nav-links">
                    <Link to="/admin-dashboard" className="admin-nav-link">
                        <LayoutDashboard size={18} /> Dashboard
                    </Link>
                    <Link to="/admin-all-issues" className="admin-nav-link">
                        <AlertCircle size={18} /> All Issues
                    </Link>
                    <Link to="/admin-users-volunteers" className="admin-nav-link">
                        <Users size={18} /> Users & Volunteers
                    </Link>
                    <Link to="/admin-requests" className="admin-nav-link">
                        <FileText size={18} /> Admin Requests
                    </Link>
                    <Link to="/admin-issues-updates" className="admin-nav-link">
                        <Clock size={18} /> Issue Updates
                    </Link>
                </nav>
                
                <div className="user-profile">
                    <Link to="/AdminProfile" className="profile-link active">
                        <div className="user-initials">{getUserInitials(mockUser.name)}</div>
                        <span className="user-name">{mockUser.name}</span>
                    </Link>
                    <button onClick={handleLogout} className="logout-btn-header">
                        <ArrowRight size={20} />
                    </button>
                </div>
            </header>

            {/* --- Main Profile Layout --- */}
            <div className="profile-page-container">
                
                {/* --- Sidebar --- */}
                <div className="profile-sidebar">
                    <div className="profile-avatar-large">
                        <span>{getUserInitials(mockUser.name)}</span>
                    </div>
                    <h2 className="profile-name">{mockUser.name}</h2>
                    <p className="profile-username">@{username}</p>
                    <p className="profile-joined">{getJoinedDate(mockUser.createdAt)}</p>

                    <div className="profile-actions">
                        <button className="update-profile-btn" onClick={() => navigate('/edit-admin-profile')}>
                            <Edit3 size={16} /> Edit Profile
                        </button>
                        <button className="logout-btn" onClick={handleLogout}>
                            <LogOut size={16} /> Logout
                        </button>
                    </div>

                    <div className="profile-badges">
                        <div className="badge verified">
                            <CheckCircle size={16} /> Verified Member
                        </div>
                        <div className="badge community-helper">
                            <Heart size={16} /> Community Helper
                        </div>
                        <div className="badge local-champion">
                            <Award size={16} /> Local Champion
                        </div>
                    </div>
                </div>

                {/* --- Main Content --- */}
                <div className="profile-main-content">
                    
                    {/* Panel 1: Profile Information */}
                    <div className="profile-panel">
                        <div className="panel-header-details">
                            <div>
                                <h3>Contact Details</h3>
                                <p>Your personal contact and geographic information</p>
                            </div>
                            {/* Changed mockPremium to use actual role check */}
                            {mockUser.role === 'admin' && <span className="premium-badge">Admin Access</span>}
                        </div>
                        <div className="profile-info-grid">
                            <InfoField icon={User} label="Full Name" value={mockUser.name} />
                            <InfoField icon={Briefcase} label="Role" value={mockUser.role.charAt(0).toUpperCase() + mockUser.role.slice(1)} />
                            <InfoField icon={Mail} label="Email Address" value={mockUser.email} />
                            <InfoField icon={Phone} label="Phone Number" value={mockUser.phone} />
                            <InfoField icon={MapPin} label="Primary Location" value={mockUser.location} />
                            <InfoField icon={Globe} label="Member Since" value={getJoinedDate(mockUser.createdAt).replace('Joined ', '')} />
                        </div>
                    </div>

                    {/* Panel 2: About Me */}
                    <div className="profile-panel about-me-panel">
                        <h3>About Me</h3>
                        <p>{mockUser.about}</p>
                    </div>
                </div>
            </div>

            {/* --- Footer --- */}
            <footer className="footer">
                <div className="footer-column footer-logo-section">
                    <div className="logo-section">
                        
                        <div className="logo-text">CivicEye</div>
                    </div>
                    <p className="footer-tagline">Civic Engagement Platform</p>
                    <p>Empowering communities to report, track, and resolve civic issues through collaborative engagement between citizens and local authorities.</p>
                    <div className="contact-info">
                        <p><Mail size={16} /> <a href="mailto:hello@civiceye.org">hello@civiceye.org</a></p>
                        <p><Phone size={16} /> <a href="tel:5551234567">(555) 123-4567</a></p>
                        <p><Globe size={16} /> <a href="http://www.cleanstreet.org" target="_blank" rel="noopener noreferrer">www.cleanstreet.org</a></p>
                    </div>
                </div>
                <div className="footer-column">
                    <h4>Platform</h4>
                    <ul>
                        <li><a href="/how-it-works">How it Works</a></li>
                        <li><a href="/features">Features</a></li>
                        <li><a href="/pricing">Pricing</a></li>
                        <li><a href="/mobile-app">Mobile App</a></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Support</h4>
                    <ul>
                        <li><a href="/help">Help Center</a></li>
                        <li><a href="/contact">Contact Us</a></li>
                        <li><a href="/user-guide">User Guide</a></li>
                        <li><a href="/forum">Community Forum</a></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Company</h4>
                    <ul>
                        <li><a href="/about">About Us</a></li>
                        <li><a href="/careers">Careers</a></li>
                        <li><a href="/press">Press Kit</a></li>
                        <li><a href="/blog">Blog</a></li>
                    </ul>
                </div>
            </footer>
        </>
    );
};

export default AdminProfile;