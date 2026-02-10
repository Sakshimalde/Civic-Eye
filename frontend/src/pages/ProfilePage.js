import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
// All necessary icons imported
import { User, Mail, MapPin, Briefcase, Award, Heart, CheckCircle, LogOut, Phone, Globe, ArrowRight, Edit3 } from 'lucide-react'; 
import './ProfilePage.css';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;


const Profile = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    
    // --- User Data from Auth Context ---
    const mockUser = {
        ...user,
        phone: user?.phone || '987-654-3210',
        location: user?.location || 'Maharashtra, India',
        about: user?.bio || 'Active community member passionate about improving our neighborhood. I believe in working together to create cleaner, safer streets for everyone.',
        isPremium: true,
    };
    // -----------------------------------------------------

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleLogout = () => {
        axios.post(`${BACKEND_URL}/api/v1/users/logout`, {}, { withCredentials: true })
            .catch(() => {})
            .finally(() => {
                signOut();
                navigate('/'); // Redirects to the homepage after logging out
            });
    };

    const getUserInitials = (name) => {
        if (!name) return 'S'; 
        const nameParts = name.split(' ');
        const initials = nameParts.map(part => part[0]).join('');
        return initials.toUpperCase();
    };

    const getJoinedDate = (dateString) => {
        if (!dateString) return 'Joined unknown date';
        const date = new Date(dateString);
        // Ensure date is valid before formatting
        if (isNaN(date)) return 'Joined unknown date'; 
        return `Joined ${date.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
    };

    const username = mockUser.email ? mockUser.email.split('@')[0] : 'cleanstreeter';

    if (!user) {
        return null;
    }
    
    // Helper component to format the info item cleanly
    const InfoField = ({ icon: Icon, label, value }) => (
        <div className="info-item">
            <Icon size={20} />
            <div className="info-text-inline">
                <span className="info-label">{label}:</span>
                <strong className="info-value">{value}</strong>
            </div>
        </div>
    );

    return (
        <>
            {/* --- Navigation Header --- */}
            <header className="header-top">
                
                <nav className="nav-links">
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/browse-issues">Browse Issues</Link>
                    <Link to="/report-issue">Report Issue</Link>
                </nav>
                <div className="user-profile">
                    <Link to="/profile" className="profile-link active">
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
                        <button className="update-profile-btn" onClick={() => navigate('/edit-profile')}>
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
                            {mockUser.isPremium && <span className="premium-badge">Premium Member</span>}
                        </div>
                        <div className="profile-info-grid">
                            {/* Updated JSX structure */}
                            <InfoField icon={User} label="Full Name" value={mockUser.name} />
                            <InfoField icon={Briefcase} label="Role" value="Citizen Contributor" />
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

                    {/* Panel 3: Contributor Badges (Activity Summary) */}
                    
                </div>
            </div>

            {/* --- Footer --- */}
            <footer className="footer">
                <div className="footer-column footer-logo-section">
                    
                    <p className="footer-tagline">Civic Engagement Platform</p>
                    <p>Empowering communities to report, track, and resolve civic issues through collaborative engagement between citizens and local authorities.</p>
                    <div className="contact-info">
                        <p><Mail size={16} /> <a href="mailto:hello@civiceye.org">hello@civiceye.org</a></p>
                        <p><Phone size={16} /> <a href="tel:5551234567">(555) 123-4567</a></p>
                        <p><Globe size={16} /> <a href="http://www.civiceye.org" target="_blank" rel="noopener noreferrer">www.civiceye.org</a></p>
                    </div>
                </div>
                <div className="footer-column">
                    <h4>Platform</h4>
                    <ul>
                        <li><a href="#">How it Works</a></li>
                        <li><a href="#">Features</a></li>
                        <li><a href="#">Pricing</a></li>
                        <li><a href="#">Mobile App</a></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Support</h4>
                    <ul>
                        <li><a href="#">Help Center</a></li>
                        <li><a href="#">Contact Us</a></li>
                        <li><a href="#">User Guide</a></li>
                        <li><a href="#">Community Forum</a></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Company</h4>
                    <ul>
                        <li><a href="#">About Us</a></li>
                        <li><a href="#">Careers</a></li>
                        <li><a href="#">Press Kit</a></li>
                        <li><a href="#">Blog</a></li>
                    </ul>
                </div>
            </footer>
        </>
    );
};

export default Profile;