import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
    AlertCircle, Clock, CheckCircle, AlertTriangle, 
    TrendingUp, Award, Target, MapPin, Edit, X,
    BarChart3, Info, Home, ArrowRight, LogOut // Ensure LogOut is available if needed, using ArrowRight for button
} from 'lucide-react';
import './Volunteer.css';

const Volunteer = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [updateForm, setUpdateForm] = useState({
        status: 'In Progress',
        proofPhoto: null,
        workNotes: ''
    });

    const stats = [
        { label: 'My Issues', value: '12', icon: AlertCircle, color: 'stat-blue' },
        { label: 'In Progress', value: '3', icon: Clock, color: 'stat-orange' },
        { label: 'Resolved', value: '47', icon: CheckCircle, color: 'stat-green' },
        { label: 'Total Issues', value: '156', icon: AlertTriangle, color: 'stat-purple' }
    ];

    const impactStats = [
        { label: 'Success Rate', value: '96%', icon: TrendingUp },
        { label: 'Avg Resolution', value: '1.8d', icon: Award },
        { label: 'Community Rating', value: '4.9/5', icon: Target }
    ];

    const tools = [
        {
            icon: Info,
            title: 'My Assigned Issues',
            description: 'View and update your assigned tasks',
            color: 'tool-blue',
            path: '/MyAssignedIssues'
        },
        {
            icon: MapPin,
            title: 'Browse All Issues',
            description: 'View all community issues',
            color: 'tool-green',
            path: '/volunteer-browser-issues'
        }
    ];

    const handleUpdateClick = (issue) => {
        setSelectedIssue(issue);
        setShowUpdateModal(true);
    };

    const handleSubmitUpdate = (e) => {
        e.preventDefault();
        console.log('Update submitted:', { issue: selectedIssue, update: updateForm });
        alert('Update submitted for admin approval!');
        setShowUpdateModal(false);
        setUpdateForm({ status: 'In Progress', proofPhoto: null, workNotes: '' });
    };

    const getUserInitials = (name) => {
        if (!name) return 'SW';
        return name.split(' ').map(part => part[0]).join('').toUpperCase();
    };
    
    const handleToolClick = (path) => {
        navigate(path, { state: { userType: 'volunteer' } });
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            // Note: Replace with actual axios logout if necessary, but this follows the sign-out context pattern
            signOut();
            navigate('/');
        }
    };

    // Mock issue data for the modal functionality to work
    // In a real app, this would come from the issues list
    const mockIssue = { 
        title: 'Pothole on Main St', 
        status: 'In Progress', 
        location: '123 Main St, North District' 
    };
    if (showUpdateModal && !selectedIssue) {
        setSelectedIssue(mockIssue);
    }

    return (
        <div className="volunteer-dashboard">
            {/* Header: Using Dashboard.js class names */}
            <header className="header-top">

                <nav className="nav-links">
                    <Link to="/volunteer-dashboard" className="active">Dashboard</Link>
                    <Link to="/MyAssignedIssues">My Assigned Issues</Link>
                    <Link to="/volunteer-browser-issues">Browse Issues</Link>
                </nav>
                <div className="user-profile">
                    <Link to="/volunteer-profile" className="profile-link">
                        <div className="user-initials">{getUserInitials(user?.name || 'Vaidehi Jadhav')}</div>
                        <span className="user-name">{user?.name || 'Vaidehi Jadhav'}</span>
                    </Link>
                    <button onClick={handleLogout} className="logout-btn-header">
                        <ArrowRight size={20} />
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Welcome back, {user?.name.split(' ')[0] || 'Sarah'}!</h1>
                    <p className="hero-subtitle">
                        Making a difference in North District - Thank you for your dedication to improving our community!
                    </p>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="stats-grid">
                    {stats.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <div key={idx} className={`stat-card ${stat.color}`}>
                                <div className="stat-content">
                                    <div className="stat-label">{stat.label}</div>
                                    <div className="stat-value">{stat.value}</div>
                                </div>
                                <Icon className="stat-icon" size={48} />
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Main Content */}
            <main className="main-content">
                {/* Impact Dashboard */}
                <section className="impact-section">
                    <div className="section-header">
                        <div className="section-title-group">
                            <Award size={22} className="section-icon" />
                            <h2 className="section-title">Volunteer Impact Dashboard</h2>
                        </div>
                    </div>
                    <p className="impact-description">
                        Your dedication to community service makes a real difference! Track your assigned issues, 
                        update work progress, and see the positive impact you're creating in North District.
                    </p>
                    
                    <div className="metrics-grid">
                        {impactStats.map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div key={idx} className="metric-card">
                                    <Icon size={24} className="metric-icon" />
                                    <div className="metric-content">
                                        <div className="metric-label">{stat.label}</div>
                                        <div className="metric-value">{stat.value}</div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div className="impact-image">
                            <img 
                                src="/images/volunteer-impact.jpg" 
                                alt="Volunteer Impact" 
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=300&fit=crop';
                                }}
                            />
                        </div>
                    </div>
                </section>

                {/* Volunteer Tools */}
                <section className="tools-section">
                    <h2 className="section-title">Volunteer Tools</h2>
                    <div className="tools-grid">
                        {tools.map((tool, idx) => {
                            const Icon = tool.icon;
                            return (
                                <div 
                                    key={idx} 
                                    className={`tool-card ${tool.color}`}
                                    onClick={() => handleToolClick(tool.path)}
                                >
                                    <div className="tool-icon">
                                        <Icon size={24} />
                                    </div>
                                    <div className="tool-content">
                                        <h3 className="tool-title">{tool.title}</h3>
                                        <p className="tool-description">{tool.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* Update Modal */}
            {showUpdateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div>
                                <div className="modal-title-row">
                                    <Edit size={20} />
                                    <h3>Update Issue Status</h3>
                                </div>
                                <p className="modal-subtitle">Submit a status update request for admin approval</p>
                            </div>
                            <button className="close-btn" onClick={() => setShowUpdateModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Issue Info */}
                            <div className="info-section">
                                <div className="info-title">Issue Information</div>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <div className="info-label">Issue Title</div>
                                        <div className="info-value">{selectedIssue?.title}</div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-label">Category</div>
                                        <div className="info-value">Infrastructure</div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-label">Volunteer Name</div>
                                        <div className="info-value">{user?.name || 'Sarah Wilson'}</div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-label">Current Status</div>
                                        <div className="info-value">{selectedIssue?.status}</div>
                                    </div>
                                    <div className="info-item full-width">
                                        <div className="info-label">Location</div>
                                        <div className="info-value">{selectedIssue?.location}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Update */}
                            <div className="update-section">
                                <div className="update-title">Status Update</div>
                                <div className="form-group">
                                    <label>New Status *</label>
                                    <select 
                                        value={updateForm.status}
                                        onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                                        className="form-select"
                                    >
                                        <option>In Progress</option>
                                        <option>Completed</option>
                                        <option>Needs Review</option>
                                    </select>
                                    <small>Choose the appropriate status for this issue</small>
                                </div>
                            </div>

                            {/* Documentation */}
                            <div className="documentation-section">
                                <div className="documentation-title">Documentation</div>
                                <div className="form-group">
                                    <label>Proof Photo</label>
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setUpdateForm({...updateForm, proofPhoto: e.target.files[0]})}
                                        className="form-input"
                                    />
                                    <small>Upload photo evidence of work completed (recommended)</small>
                                </div>
                                <div className="form-group">
                                    <label>Work Notes *</label>
                                    <textarea 
                                        value={updateForm.workNotes}
                                        onChange={(e) => setUpdateForm({...updateForm, workNotes: e.target.value})}
                                        placeholder="Describe the work performed and current status..."
                                        className="form-textarea"
                                        rows="4"
                                    />
                                    <small>Provide detailed information about the work completed</small>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="modal-actions">
                                <button className="submit-btn" onClick={handleSubmitUpdate}>
                                    Submit for Approval
                                </button>
                                <button className="cancel-btn" onClick={() => setShowUpdateModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Volunteer;