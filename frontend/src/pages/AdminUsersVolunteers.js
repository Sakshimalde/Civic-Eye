import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
    LayoutDashboard, AlertCircle, Users, Clock, 
    User as UserIcon, UserCheck, ArrowRight, BarChart3, Loader2 
} from 'lucide-react';
import './AdminUsersVolunteers.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

// If assignedTo matches a department string it is NOT a volunteer name
const DEPARTMENTS = [
    "Municipal sanitation and public health",
    "Roads and street infrastructure",
    "Street lighting and electrical assets",
    "Water, sewerage, and stormwater",
    "Ward/zone office and central admin"
];

const fetchAllUsers = async () => {
    const res = await axios.get(`${API_BASE_URL}/users/list-all`, { withCredentials: true });
    return res.data.data;
};

const fetchAllComplaints = async () => {
    const res = await axios.get(`${API_BASE_URL}/complaints/all`, { withCredentials: true });
    return res.data.data;
};

const AdminUsersVolunteers = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    const [allUsers, setAllUsers]           = useState([]);
    const [allComplaints, setAllComplaints] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);

    // Fetch users AND complaints in parallel
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [userData, complaintData] = await Promise.all([
                fetchAllUsers(),
                fetchAllComplaints(),
            ]);
            setAllUsers(userData || []);
            setAllComplaints(complaintData || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) loadData();
    }, [user, loadData]);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            signOut();
            navigate('/');
        }
    };

    const getUserInitials = (name) => {
        if (!name) return 'MJ';
        return name.split(' ').map(p => p[0]).join('').toUpperCase();
    };

    const { citizenUsers, volunteers, stats } = useMemo(() => {
        const citizens = allUsers.filter(u => u.role === 'user');
        const vols     = allUsers.filter(u => u.role === 'volunteer');

        // Build name → { assigned, resolved } map from complaints
        // assignedTo holds volunteer name after assignment (departments are filtered out)
        const countMap = {};
        allComplaints.forEach(c => {
            const name = c.assignedTo?.trim();
            if (!name || DEPARTMENTS.includes(name)) return;

            const key = name.toLowerCase();
            if (!countMap[key]) countMap[key] = { assigned: 0, resolved: 0 };
            countMap[key].assigned += 1;
            if (c.status === 'resolved') countMap[key].resolved += 1;
        });

        // Attach live counts to each volunteer
        const enrichedVols = vols.map(v => {
            const counts = countMap[v.name?.trim().toLowerCase()] || { assigned: 0, resolved: 0 };
            return { ...v, assignedCount: counts.assigned, resolvedCount: counts.resolved };
        });

        const totalReports = citizens.reduce((sum, u) => sum + (u.reportsCount || 0), 0);

        const summaryStats = [
            { label: 'Total Citizens',    value: citizens.length, icon: UserIcon,  color: '#3b82f6' },
            { label: 'Active Volunteers', value: vols.length,     icon: UserCheck, color: '#22c55e' },
            { label: 'Total Reports',     value: totalReports,    icon: BarChart3, color: '#f59e0b' },
        ];

        return { citizenUsers: citizens, volunteers: enrichedVols, stats: summaryStats };
    }, [allUsers, allComplaints]);

    if (loading || !user) {
        return (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', flexDirection:'column', gap:12 }}>
                <Loader2 size={36} style={{ animation:'spin 1s linear infinite' }} />
                <p>{loading ? 'Loading users and stats...' : 'Authenticating...'}</p>
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
                        <Link to="/admin-issues-updates" className="admin-nav-link">
                            <Clock size={18} /> Issue Updates
                        </Link>
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

            {/* Hero */}
            <div className="users-hero">
                <div className="users-hero-content">
                    <div className="users-hero-icon"><Users size={40} /></div>
                    <div className="users-hero-text">
                        <h1>Users & Volunteers</h1>
                        <p>Manage and coordinate all users and volunteers in the CivicEye community</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
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
                    <div className="users-stat-card" style={{ opacity:0, visibility:'hidden' }} />
                </div>
            </div>

            {/* Main Content */}
            <div className="users-main-content">
                {error && <div className="error-message">{error}</div>}

                {/* Citizen Users */}
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
                                {citizenUsers.length > 0 ? citizenUsers.map(citizen => (
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
                                        <td>{citizen.location || '—'}</td>
                                        <td>
                                            <span className="reports-badge">{citizen.reportsCount || 0}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" className="empty-table-cell">No citizen users found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Volunteers */}
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
                                {volunteers.length > 0 ? volunteers.map(volunteer => (
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
                                        <td>{volunteer.location || '—'}</td>
                                        <td>
                                            {/* ✅ Real count: all complaints where assignedTo === volunteer name */}
                                            <span className="assigned-badge">{volunteer.assignedCount}</span>
                                        </td>
                                        <td>
                                            {/* ✅ Real count: complaints where status === 'resolved' */}
                                            <span className="resolved-badge">{volunteer.resolvedCount}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="empty-table-cell">No active volunteers found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUsersVolunteers;