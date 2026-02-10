import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
    LayoutDashboard, AlertCircle, Users, FileText, Clock, 
    User as UserIcon, UserCheck, ArrowRight, BarChart3, Loader2 
} from 'lucide-react';
import './AdminUsersVolunteers.css'; // Assuming this CSS file exists

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE_URL =  `${BACKEND_URL}/api/v1`; 

// --- API Fetcher (Defined locally) ---
const fetchAllUsersAndStats = async () => {
    const response = await axios.get(`${API_BASE_URL}/users/list-all`, { withCredentials: true });
    return response.data.data;
};

const AdminUsersVolunteers = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching Logic ---
    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAllUsersAndStats(); 
            setAllUsers(data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch user and volunteer data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            loadUsers();
        }
        // NOTE: Redirection based on role (if needed) is handled here implicitly, 
        // and unauthorized users are blocked by the 403 error from the backend.
    }, [user, loadUsers]);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            signOut();
            navigate('/');
        }
    };

    const getUserInitials = (name) => {
        if (!name) return 'MJ';
        return name.split(' ').map(part => part[0]).join('').toUpperCase();
    };

    // --- Data Processing (Memoized) ---
    const { citizenUsers, volunteers, stats } = useMemo(() => {
        const citizens = allUsers.filter(u => u.role === 'user');
        const vols = allUsers.filter(u => u.role === 'volunteer');
        
        const totalCitizens = citizens.length;
        const activeVolunteers = vols.length;
        // Total Reports is calculated by summing reportsCount from all citizen user objects
        const totalReports = citizens.reduce((sum, u) => sum + (u.reportsCount || 0), 0);
        
        const summaryStats = [
            // Note: Colors are hardcoded based on the CSS provided earlier.
            { label: 'Total Citizens', value: totalCitizens.toString(), icon: UserIcon, color: '#3b82f6' },
            { label: 'Active Volunteers', value: activeVolunteers.toString(), icon: UserCheck, color: '#22c55e' },
            { label: 'Total Reports', value: totalReports.toString(), icon: BarChart3, color: '#f59e0b' }
        ];

        return {
            citizenUsers: citizens,
            volunteers: vols,
            stats: summaryStats
        };
    }, [allUsers]);

    // Handle initial loading and unauthorized states
    if (loading || !user) {
        return (
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <Loader2 size={36} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                <p>{loading ? "Loading users and stats..." : "Authenticating..."}</p>
            </div>
        );
    }
    
    return (
        <div className="admin-users-page">
            {/* Header */}
            <header className="admin-header">
                <div className="admin-header-left">
                    <div className="admin-logo">
                        
                        <div className="admin-logo-text">
                            <div className="admin-logo-title">Civiceye</div>
                            <div className="admin-logo-subtitle">Civic Platform</div>
                        </div>
                    </div>
                    <nav className="admin-nav">
                        <Link to="/admin-dashboard" className="admin-nav-link">
                            <LayoutDashboard size={18} /> Dashboard
                        </Link>
                        <Link to="/admin-all-issues" className="admin-nav-link">
                            <AlertCircle size={18} /> All Issues
                        </Link>
                        <Link to="/admin-users-volunteers" className="admin-nav-link active">
                            <Users size={18} /> Users & Volunteers
                        </Link>
                        {/* <Link to="/admin-requests" className="admin-nav-link">
                            <FileText size={18} /> Admin Requests
                        </Link> */}
                        {/* <Link to="/admin-issues-updates" className="admin-nav-link">
                            <Clock size={18} /> Issue Updates
                        </Link> */}
                    </nav>
                </div>
                <div className="user-profile">
                    <Link to="/AdminProfile" className="profile-link">
                        <div className="user-initials">{getUserInitials(user.name)}</div>
                        <span className="user-name">{user.name}</span>
                    </Link>
                    <button onClick={handleLogout} className="logout-btn-header">
                        <ArrowRight size={20} />
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <div className="users-hero">
                <div className="users-hero-content">
                    <div className="users-hero-icon">
                        <Users size={40} />
                    </div>
                    <div className="users-hero-text">
                        <h1>Users & Volunteers</h1>
                        <p>Manage and coordinate all users and volunteers in the Clean Street community</p>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="users-stats-section">
                <div className="users-stats-grid">
                    {stats.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <div key={idx} className="users-stat-card">
                                <div className="users-stat-icon" style={{ backgroundColor: stat.color + '20' }}>
                                    <Icon size={24} color={stat.color} />
                                </div>
                                <div className="users-stat-info">
                                    <div className="users-stat-label">{stat.label}</div>
                                    <div className="users-stat-value">{stat.value}</div>
                                </div>
                            </div>
                        );
                    })}
                    {/* Placeholder to match grid layout in image */}
                    <div className="users-stat-card" style={{opacity: 0, visibility: 'hidden'}}></div> 
                </div>
            </div>

            {/* Main Content */}
            <div className="users-main-content">
                {error && <div className="error-message">{error}</div>}
                
                {/* Citizen Users Section */}
                <div className="users-section">
                    <div className="users-section-header">
                        <div className="users-section-title">
                            <UserIcon size={20} />
                            <h2>Citizen Users</h2>
                        </div>
                    </div>
                    <p className="users-section-subtitle">Users who report issues in the community</p>

                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Location</th>
                                    <th>Reports</th>
                                </tr>
                            </thead>
                            <tbody>
                                {citizenUsers.length > 0 ? citizenUsers.map((citizen) => (
                                    <tr key={citizen._id}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-small">
                                                    {getUserInitials(citizen.name)}
                                                </div>
                                                <div className="user-info-cell">
                                                    <div className="user-name-cell">{citizen.name}</div>
                                                    <div className="user-email-cell">{citizen.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{citizen.location}</td>
                                        <td>
                                            <span className="reports-badge">{citizen.reportsCount || 0}</span>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan="3" className="empty-table-cell">No citizen users found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Volunteers Section */}
                <div className="users-section">
                    <div className="users-section-header">
                        <div className="users-section-title">
                            <UserCheck size={20} />
                            <h2>Volunteers</h2>
                        </div>
                    </div>
                    <p className="users-section-subtitle">Volunteers who resolve community issues</p>

                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Area</th>
                                    <th>Assigned</th>
                                    <th>Resolved</th>
                                </tr>
                            </thead>
                            <tbody>
                                {volunteers.length > 0 ? volunteers.map((volunteer) => (
                                    <tr key={volunteer._id}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-small volunteer">
                                                    {getUserInitials(volunteer.name)}
                                                </div>
                                                <div className="user-info-cell">
                                                    <div className="user-name-cell">{volunteer.name}</div>
                                                    <div className="user-email-cell">{volunteer.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{volunteer.location}</td>
                                        <td>
                                            <span className="assigned-badge">{volunteer.assigned || 0}</span>
                                        </td>
                                        <td>
                                            <span className="resolved-badge">{volunteer.resolved || 0}</span>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan="4" className="empty-table-cell">No active volunteers found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUsersVolunteers;