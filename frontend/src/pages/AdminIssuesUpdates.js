import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
    LayoutDashboard, AlertCircle, Users, FileText, 
    Clock, CheckCircle, XCircle, ArrowRight,
    Calendar, Loader2
} from 'lucide-react';
import './AdminIssuesUpdates.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE_URL =  `${BACKEND_URL}/api/v1`; 


// ---------------- Utility Functions ----------------
const getStatusBadgeClass = (status) => {
    const statusMap = {
        'pending': 'status-pending',
        'in progress': 'status-progress',
        'inreview': 'status-review',
        'resolved': 'status-resolved',
        'recived': 'status-pending'
    };
    return statusMap[status.toLowerCase()] || 'status-default';
};

const getUserInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
};

// ---------------- Component ----------------
const AdminIssueUpdates = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [processing, setProcessing] = useState(false);

    // --- Fetch Pending Updates ---
    const fetchUpdates = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setFetchError(null);

        try {
            const response = await axios.get(`${API_BASE_URL}/complaints/pending-requests`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            // Ensure we filter only issues that have pending updates
            const pendingUpdates = response.data.data.filter(comp => comp.pendingUpdate === true);

            const mappedUpdates = pendingUpdates.map(comp => ({
    id: comp._id,
    issueTitle: comp.title,
    volunteer: comp.assignedTo || 'Unknown Volunteer',
    statusChange: comp.statusChange || { from: 'In Progress', to: 'Resolved' },
    submittedDate: new Date(comp.updatedAt).toLocaleDateString(),
    proofPhoto: comp.photo ? 'Available' : 'None',
    notes: comp.workNotes || comp.description || '',
    resolution: comp.resolution || 'This update marks the issue as completed. Approving will set status to Resolved.'
}));


            setUpdates(mappedUpdates);
        } catch (err) {
            console.error("Fetch Error:", err.response?.data || err.message);
            setFetchError('Failed to fetch issue updates.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchUpdates();
    }, [fetchUpdates]);

    // --- Approve Update ---
    const handleApprove = async (updateId) => {
        if (processing || !window.confirm('Approve this status update? Status will be set to RESOLVED.')) return;

        setProcessing(true);
        try {
            await axios.put(`${API_BASE_URL}/complaints/${updateId}`, 
                { status: 'resolved', pendingUpdate: false }, 
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            alert('Status update approved successfully! Issue is now Resolved.');
            setUpdates(updates.filter(u => u.id !== updateId));
        } catch (error) {
            console.error("Approval failed:", error.response?.data || error.message);
            alert('Approval failed: ' + (error.response?.data?.message || 'Server error.'));
        } finally {
            setProcessing(false);
        }
    };

    // --- Reject Update ---
    const handleReject = async (updateId) => {
        if (processing) return;
        const reason = window.prompt('Please provide a reason for rejection (required):');

        if (reason && reason.trim()) {
            setProcessing(true);
            try {
                await axios.put(`${API_BASE_URL}/complaints/${updateId}`, 
                    { status: 'in progress', rejectionNote: reason, pendingUpdate: false }, 
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );

                alert('Status update rejected. Volunteer notified. Issue status reset to In Progress.');
                setUpdates(updates.filter(u => u.id !== updateId));
            } catch (error) {
                console.error("Rejection failed:", error.response?.data || error.message);
                alert('Rejection failed: ' + (error.response?.data?.message || 'Server error.'));
            } finally {
                setProcessing(false);
            }
        } else if (reason !== null) {
            alert('Rejection requires a reason.');
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            signOut();
            navigate('/');
        }
    };

    if (!user) return <div className="loading-state">Authenticating...</div>;

    return (
        <div className="admin-issue-updates">
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
                        <Link to="/admin-all-issues" className="admin-nav-link">
                            <AlertCircle size={18} /> All Issues
                        </Link>
                        <Link to="/admin-users-volunteers" className="admin-nav-link">
                            <Users size={18} /> Users & Volunteers
                        </Link>
                        <Link to="/admin-requests" className="admin-nav-link">
                            <FileText size={18} /> Admin Requests
                        </Link>
                        <Link to="/admin-issues-updates" className="admin-nav-link active">
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

            <div className="updates-container">
                <div className="updates-page-header">
                    <h1 className="updates-page-title">Issue Updates</h1>
                    <p className="updates-page-subtitle">Review and approve status updates submitted by volunteers</p>
                </div>

                {loading && (
                    <div className="loading-message">
                        <Loader2 size={24} className="spinner" /> Fetching pending updates...
                    </div>
                )}
                {fetchError && <div className="error-message">Error: {fetchError}</div>}

                <div className="updates-list">
                    {!loading && updates.length === 0 && !fetchError && (
                        <div className="no-updates-message">
                            <CheckCircle size={32} />
                            <p>No pending updates requiring administrative review.</p>
                        </div>
                    )}

                    {updates.map((update) => (
                        <div key={update.id} className="update-card">
                            <div className="update-header">
                                <div className="update-title-section">
                                    <Clock size={16} className="update-icon" />
                                    <h3 className="update-title">{update.issueTitle}</h3>
                                </div>
                                <span className="volunteer-name">Updated by {update.volunteer}</span>
                            </div>

                            <div className="update-body">
                                <div className="status-change-section">
                                    <div className="label">Status Change:</div>
                                    <div className="status-badges">
                                        <span className={`status-badge ${getStatusBadgeClass(update.statusChange.from)}`}>
                                            {update.statusChange.from}
                                        </span>
                                        <span className="status-arrow">→</span>
                                        <span className={`status-badge ${getStatusBadgeClass(update.statusChange.to)}`}>
                                            {update.statusChange.to}
                                        </span>
                                    </div>
                                </div>

                                <div className="update-meta">
                                    <div className="meta-item">
                                        <Calendar size={14} />
                                        <span className="meta-label">Submitted</span>
                                        <span className="meta-value">{update.submittedDate}</span>
                                    </div>
                                    <div className="meta-item">
                                        <FileText size={14} />
                                        <span className="meta-label">Proof Photo</span>
                                        <span className="meta-value">{update.proofPhoto}</span>
                                    </div>
                                </div>

                                <div className="volunteer-notes-section">
                                    <div className="notes-label">Volunteer Notes:</div>
                                    <p className="notes-text">{update.notes}</p>
                                </div>
                            </div>

                            <div className="update-actions">
                                <button 
                                    className="action-btn approve-btn"
                                    onClick={() => handleApprove(update.id)}
                                    disabled={processing}
                                >
                                    <CheckCircle size={16} />
                                    {processing ? <Loader2 size={16} className="spinner" /> : 'Approve'}
                                </button>
                                <button 
                                    className="action-btn reject-btn"
                                    onClick={() => handleReject(update.id)}
                                    disabled={processing}
                                >
                                    <XCircle size={16} />
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminIssueUpdates;
