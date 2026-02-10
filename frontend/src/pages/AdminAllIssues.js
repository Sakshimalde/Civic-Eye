import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
    LayoutDashboard, AlertCircle, Users, FileText, Clock, 
    CheckCircle, BarChart3, Search, UserX, UserCheck,ArrowRight, 
    User as UserIcon, Loader2 
} from 'lucide-react';
import './AdminAllIssues.css';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE_URL =  `${BACKEND_URL}/api/v1`; 

// List of standard department strings used during initial complaint registration
const DEPARTMENTS = [
    "Municipal sanitation and public health",
    "Roads and street infrastructure",
    "Street lighting and electrical assets",
    "Water, sewerage, and stormwater",
    "Ward/zone office and central admin"
];
// ------------------------------------------------------------------

// --- Assign/Reassign Button Component ---
const AssignButton = ({ issue, volunteers, onAssign }) => {
    const [isReassigning, setIsReassigning] = useState(false);
    const [selectedVolunteer, setSelectedVolunteer] = useState(issue.assignedTo);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setSelectedVolunteer(issue.assignedTo);
    }, [issue.assignedTo]);

    const isAssigned = issue.assignedTo && issue.assignedTo !== 'Unassigned';
    const isSameVolunteer = selectedVolunteer === issue.assignedTo;

    const handleAssignment = async () => {
        if (!selectedVolunteer || selectedVolunteer === 'Unassigned' || isSameVolunteer) {
            setIsReassigning(false);
            return;
        }
        
        setIsSaving(true);

        try {
            await axios.put(`${API_BASE_URL}/complaints/assign/${issue.id}`, 
                { assignedTo: selectedVolunteer },
                { withCredentials: true }
            );

            onAssign(issue.id, selectedVolunteer);

            setIsReassigning(false);
            alert(`Issue ${issue.id} successfully assigned to ${selectedVolunteer}.`);

        } catch (error) {
            console.error("Assignment failed:", error.response?.data || error.message);
            alert(`Failed to assign issue: ${error.response?.data?.message || 'Server error.'}`);
            
            setSelectedVolunteer(issue.assignedTo); 
        } finally {
            setIsSaving(false);
        }
    };

    if (isReassigning) {
        return (
            <div className="reassign-control-inline">
                <select 
                    value={selectedVolunteer || 'Unassigned'} 
                    onChange={(e) => setSelectedVolunteer(e.target.value === 'Unassigned' ? null : e.target.value)}
                    className="volunteer-select-admin"
                    disabled={isSaving}
                >
                    <option value="Unassigned">Select Volunteer</option>
                    {/* CRITICAL FIX: Use the live 'volunteers' prop */}
                    {volunteers.map(v => ( 
                        <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                </select>
                <div className="reassign-actions-group">
                    <button 
                        className="action-btn assign-confirm-btn"
                        onClick={handleAssignment}
                        disabled={isSaving || !selectedVolunteer || selectedVolunteer === 'Unassigned' || isSameVolunteer}
                    >
                        {isSaving ? <Loader2 size={14} className="spinner" /> : <UserCheck size={14} />}
                        {isSaving ? 'Saving...' : 'Assign'}
                    </button>
                    <button 
                        className="action-btn assign-cancel-btn"
                        onClick={() => { 
                            setIsReassigning(false); 
                            setSelectedVolunteer(issue.assignedTo);
                        }}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="assigned-display">
            <span className="assigned-name-display">{issue.assignedTo || 'Unassigned'}</span>
            <button 
                className={`reassign-btn ${isAssigned ? 'reassign' : 'assign'}`}
                onClick={() => setIsReassigning(true)}
            >
                {isAssigned ? <UserX size={14} /> : <UserIcon size={14} />}
                {isAssigned ? 'Reassign' : 'Assign'}
            </button>
        </div>
    );
};
// ------------------------------------------------------------------

const AllIssuesAdmin = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    
    // --- State for Live Data ---
    const [allIssues, setAllIssues] = useState([]);
    const [allVolunteers, setAllVolunteers] = useState([]); // Live volunteers list
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [authChecked, setAuthChecked] = useState(false); 
    // ----------------------------

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

    const mapStatus = (serverStatus) => {
        switch (serverStatus) {
            case 'recived': return 'Pending';
            case 'inReview': return 'In Progress';
            case 'resolved': return 'Resolved';
            default: return 'Pending';
        }
    };
    
    // --- API Fetch Functions ---
    const fetchVolunteers = useCallback(async () => {
        try {
            // Fetches all users and filters for volunteers
            const response = await axios.get(`${API_BASE_URL}/users/list-all`, { withCredentials: true });
            const volunteersList = response.data.data.filter(u => u.role === 'volunteer').map(v => ({
                id: v._id,
                name: v.name,
                location: v.location 
            }));
            setAllVolunteers(volunteersList);
        } catch (err) {
            console.error("Failed to fetch volunteer list:", err.message);
        }
    }, []);


    const fetchIssues = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${API_BASE_URL}/complaints/all`, {
                withCredentials: true
            });
            
            const mappedIssues = response.data.data.map(comp => {
                const statusText = mapStatus(comp.status);
                const mockPriority = ['high', 'medium', 'low'][Math.floor(Math.random() * 3)];
                
                let assignedToName = comp.assignedTo; 
                
                // CRITICAL FIX: If assignedTo is one of the department strings, show it as null/Unassigned.
                if (DEPARTMENTS.includes(assignedToName)) {
                    assignedToName = null; 
                }

                const mockReportedBy = comp.userId?.name || 'Anonymous Citizen'; 

                return {
                    id: comp._id,
                    title: comp.title,
                    status: statusText.toLowerCase().replace(' ', ''), 
                    priority: mockPriority, 
                    assignedTo: assignedToName, // Name comes directly from DB
                    reportedBy: mockReportedBy,
                    date: new Date(comp.createdAt).toLocaleDateString('en-US'),
                };
            });

            setAllIssues(mappedIssues);
        } catch (err) {
            console.error("Failed to fetch issues:", err.response?.data || err.message);
            setError('Failed to fetch issues data.');
        } finally {
            setLoading(false);
        }
    }, []); 

    // --- Auth Check and Data Fetch Effects ---
    useEffect(() => {
        const checkAuth = setTimeout(() => { setAuthChecked(true); }, 50); 
        return () => clearTimeout(checkAuth);
    }, []);

    useEffect(() => {
        if (!authChecked) return;
        if (user) {
            fetchIssues();
            fetchVolunteers(); // Fetch the list of volunteers
        } else {
            navigate('/login');
        }
    }, [user, navigate, fetchIssues, fetchVolunteers, authChecked]);


    // --- Data Aggregation and Filtering ---
    const filteredIssues = useMemo(() => {
        if (!searchTerm) return allIssues;
        const lowerSearchTerm = searchTerm.toLowerCase();
        return allIssues.filter(issue => 
            issue.title.toLowerCase().includes(lowerSearchTerm) ||
            issue.reportedBy.toLowerCase().includes(lowerSearchTerm) ||
            (issue.assignedTo || '').toLowerCase().includes(lowerSearchTerm) ||
            issue.status.toLowerCase().includes(lowerSearchTerm)
        );
    }, [allIssues, searchTerm]);

    const dynamicStats = useMemo(() => {
        const total = allIssues.length;
        const inProgress = allIssues.filter(i => i.status === 'inprogress').length;
        const resolved = allIssues.filter(i => i.status === 'resolved').length;
        const pending = allIssues.filter(i => i.status === 'pending').length;

        return [
            { label: 'Total Issues', value: total, icon: BarChart3, color: '#e5e7eb' },
            { label: 'In Progress', value: inProgress, icon: Clock, color: '#dbeafe' },
            { label: 'Resolved', value: resolved, icon: CheckCircle, color: '#dcfce7' },
            { label: 'Pending', value: pending, icon: AlertCircle, color: '#ffedd5' }
        ];
    }, [allIssues]);


    // --- Assignment Logic ---
    const handleAssignIssue = (issueId, newVolunteerName) => {
        setAllIssues(prevIssues => prevIssues.map(issue => 
            issue.id === issueId ? { ...issue, assignedTo: newVolunteerName } : issue
        ));
    };
    
    // ... (handleViewDetails and conditional rendering remains) ...
    if (!user && !authChecked) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading user session...</p>
            </div>
        );
    }
    
    if (!user) return null;

    return (
        <div className="all-issues-admin">
            {/* Header */}
            <header className="admin-header">
                <div className="admin-header-left">
                    <div className="admin-logo">
                        
                        <div className="admin-logo-text">
                            <div className="admin-logo-title">CivicEye</div>
                            <div className="admin-logo-subtitle">Civic Platform</div>
                        </div>
                    </div>
                    <nav className="admin-nav">
                        <Link to="/admin-dashboard" className="admin-nav-link">
                            <LayoutDashboard size={18} /> Dashboard
                        </Link>
                        <Link to="/admin-all-issues" className="admin-nav-link active">
                            <AlertCircle size={18} /> All Issues
                        </Link>
                        <Link to="/admin-users-volunteers" className="admin-nav-link">
                            <Users size={18} /> Users & Volunteers
                        </Link>
                        {/* <Link to="/admin-requests" className="admin-nav-link">
                            <FileText size={18} /> Admin Request
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

            <div className="issues-hero">
                <div className="issues-hero-content">
                    <BarChart3 size={36} />
                    <h1>All Issues Management</h1>
                    <p>Comprehensive oversight and management of all reported issues across the platform</p>
                </div>
            </div>

            <div className="issues-stats-grid">
                {dynamicStats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="issues-stat-card">
                            <div className="issues-stat-content">
                                <div className="issues-stat-info">
                                    <div className="issues-stat-label">{stat.label}</div>
                                    <div className="issues-stat-value">{stat.value}</div>
                                </div>
                                <div className="issues-stat-icon" style={{ backgroundColor: stat.color }}>
                                    <Icon size={24} color="#6b7280" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="issues-table-section">
                <div className="issues-table-header">
                    <div className="issues-table-title">
                        <AlertCircle size={20} />
                        <h2>Issues Overview</h2>
                    </div>
                    <p className="issues-table-subtitle">Complete list of all reported issues with management actions</p>
                </div>

                <div className="table-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search issues..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="issues-table-container">
                    {loading ? (
                        <div className="loading-state-admin">
                            <div className="loading-spinner"></div>
                            <p>Loading issues from database...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state-admin">
                            <AlertCircle size={24} color="#ef4444" />
                            <p>{error}</p>
                        </div>
                    ) : filteredIssues.length === 0 ? (
                        <div className="empty-state-admin">
                            <Search size={24} color="#9ca3af" />
                            <p>No issues found matching your search criteria.</p>
                        </div>
                    ) : (
                        <table className="issues-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Assigned To</th>
                                    <th>Reported By</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIssues.map((issue) => (
                                    <tr key={issue.id}>
                                        <td className="issue-title-cell">{issue.title}</td>
                                        <td>
                                            <span className={`status-badge status-${issue.status}`}>
                                                {issue.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`priority-badge priority-${issue.priority}`}>
                                                {issue.priority}
                                            </span>
                                        </td>
                                        
                                        <td className="assigned-cell-combined">
                                            <AssignButton 
                                                issue={issue}
                                                volunteers={allVolunteers}
                                                onAssign={handleAssignIssue}
                                            />
                                        </td>
                                        
                                        <td>{issue.reportedBy}</td>
                                        <td>{issue.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllIssuesAdmin;