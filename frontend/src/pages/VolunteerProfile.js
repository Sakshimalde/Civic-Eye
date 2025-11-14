import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// All necessary icons imported
import { 
    User, Mail, MapPin, Clock, Briefcase, Award, Heart, CheckCircle, LogOut, Phone, Globe, ArrowRight, Edit3 
} from 'lucide-react'; 
import './VolunteerProfile.css'; // Note: Ensure this CSS file has the necessary styles from the Citizen Profile

const VolunteerProfile = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    
    // --- User Data from Auth Context ---
    const profileData = {
        name: user?.name || 'Sarah Wilson',
        username: user?.username || 'sarah.wilson',
        email: user?.email || 'sarah.wilson@cleanstreet.org',
        phone: user?.phone || '+1 (555) 234 5678',
        district: user?.location || 'North District',
        joinDate: user?.createdAt || '2023-08-10T10:00:00Z',
        role: user?.role || 'Volunteer',
        bio: user?.bio || 'I am a dedicated volunteer covering the North District. I specialize in infrastructure and safety issues, aiming for rapid resolution of reported problems.',
        totalResolved: 47,
        activeAssignments: 3,
        isPremium: true,
    };
    // -----------------------------------------------------

    const handleLogout = () => {
        // In a real app, use axios for API logout before signOut()
        if (window.confirm('Are you sure you want to log out?')) {
            signOut(); 
            navigate('/');
        }
    };

    const getUserInitials = (name) => {
        if (!name) return 'SW'; 
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

    // Helper component to format the info item cleanly (copied from Citizen Profile)
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
            {/* Standard Header for Navigating to other Volunteer pages */}
            <header className="header-top">
                
                {/* Updated Navigation links for Volunteer */}
                <nav className="nav-links">
                    <Link to="/volunteer">Dashboard</Link>
                    <Link to="/MyAssignedIssues">My Assigned Issues</Link>
                    <Link to="/volunteer-browser-issues">Browse Issues</Link>
                </nav>
                {/* Profile Link in Header (active on this page) */}
                <div className="user-profile">
                    <Link to="/volunteer-profile" className="profile-link active">
                        <div className="user-initials">{getUserInitials(profileData.name)}</div>
                        <span className="user-name">{profileData.name}</span>
                    </Link>
                    <button onClick={handleLogout} className="logout-btn-header">
                        <ArrowRight size={20} />
                    </button>
                </div>
            </header>

            {/* Main Profile Layout: Adopting Citizen Profile's structure */}
            <div className="profile-page-container">
                
                {/* Sidebar */}
                <div className="profile-sidebar">
                    <div className="profile-avatar-large">
                        <span>{getUserInitials(profileData.name)}</span>
                    </div>
                    <h2 className="profile-name">{profileData.name}</h2>
                    <p className="profile-username">@{profileData.username}</p>
                    <p className="profile-joined">{getJoinedDate(profileData.joinDate)}</p>

                    <div className="profile-actions">
                        <button className="update-profile-btn" onClick={() => navigate('/edit-volunteer-profile')}>
                            <Edit3 size={16} /> Edit Profile
                        </button>
                        <button className="logout-btn" onClick={handleLogout}>
                            <LogOut size={16} /> Logout
                        </button>
                    </div>

                    <div className="profile-badges">
                        <div className="badge verified">
                            <CheckCircle size={16} /> Verified Volunteer
                        </div>
                        <div className="badge community-helper">
                            <Award size={16} /> Top Resolver
                        </div>
                        <div className="badge local-champion">
                            <MapPin size={16} /> {profileData.district} Expert
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="profile-main-content">
                    
                    {/* Panel 1: Contact and Role Information */}
                    <div className="profile-panel">
                        <div className="panel-header-details">
                            <div>
                                <h3>Volunteer Contact Details</h3>
                                <p>Your primary contact and assigned work area information</p>
                            </div>
                            {profileData.isPremium && <span className="premium-badge">Priority Access</span>}
                        </div>
                        <div className="profile-info-grid">
                            <InfoField icon={User} label="Full Name" value={profileData.name} />
                            <InfoField icon={Briefcase} label="Role" value={profileData.role} />
                            <InfoField icon={Mail} label="Email Address" value={profileData.email} />
                            <InfoField icon={Phone} label="Phone Number" value={profileData.phone} />
                            <InfoField icon={MapPin} label="Assigned District" value={profileData.district} />
                            <InfoField icon={Globe} label="Member Since" value={new Date(profileData.joinDate).toLocaleDateString()} />
                        </div>
                    </div>
                    
                    {/* Panel 2: Stats */}
                    <div className="profile-panel">
                         <div className="panel-header-details">
                            <div>
                                <h3>Performance Metrics</h3>
                                <p>Your impact and efficiency in resolving community issues</p>
                            </div>
                        </div>
                        <div className="profile-info-grid">
                            <InfoField icon={CheckCircle} label="Total Resolved" value={profileData.totalResolved} />
                            <InfoField icon={Heart} label="Active Assignments" value={profileData.activeAssignments} />
                            <InfoField icon={Award} label="Completion Rate" value="96%" />
                            <InfoField icon={Clock} label="Avg Resolution Time" value="1.8 days" />
                        </div>
                    </div>

                    {/* Panel 3: About Me */}
                    <div className="profile-panel about-me-panel">
                        <h3>About Me</h3>
                        <p>{profileData.bio}</p>
                    </div>
                </div>
            </div>

            {/* The footer must also be included if it's part of the global layout */}
            <footer className="footer">
                {/* Footer content goes here... copied from Profile.js for structure */}
                <div className="footer-column footer-logo-section">...</div>
                <div className="footer-column">...</div>
                <div className="footer-column">...</div>
                <div className="footer-column">...</div>
            </footer>
        </>
    );
};

export default VolunteerProfile;