import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
    LayoutDashboard, AlertCircle, Users, FileText,
    Clock, CheckCircle, XCircle, ArrowRight,
    Calendar, Loader2, MapPin, User, FileImage
} from 'lucide-react';
import './AdminIssuesUpdates.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

const getStatusBadgeClass = (status) => {
    const statusMap = {
        'pending': 'status-pending',
        'in progress': 'status-progress',
        'inreview': 'status-review',
        'resolved': 'status-resolved',
        'recived': 'status-pending'
    };
    return statusMap[status?.toLowerCase()] || 'status-default';
};

const getUserInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
};

const AdminIssueUpdates = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    // ── Pending citizen approvals ────────────────────────────
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [approvalsLoading, setApprovalsLoading] = useState(true);
    const [approvalsError, setApprovalsError] = useState(null);
    const [processingApproval, setProcessingApproval] = useState(false);

    // ── Volunteer resolution updates ─────────────────────────
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [processing, setProcessing] = useState(false);

    // ── Fetch pending citizen complaints (awaiting admin approval) ──
    const fetchPendingApprovals = useCallback(async () => {
        if (!user) return;
        setApprovalsLoading(true);
        setApprovalsError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/complaints/pending-approvals`, {
                withCredentials: true
            });
            setPendingApprovals(response.data.data || []);
        } catch (err) {
            console.error("Fetch approvals error:", err.response?.data || err.message);
            setApprovalsError('Failed to fetch pending complaints.');
        } finally {
            setApprovalsLoading(false);
        }
    }, [user]);

    // ── Fetch volunteer resolution updates ───────────────────
    const fetchUpdates = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setFetchError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/complaints/pending-requests`, {
                withCredentials: true
            });

            const pendingUpdates = (response.data.data || []).filter(comp => comp.pendingUpdate === true);

            const mappedUpdates = pendingUpdates.map(comp => ({
                id: comp._id,
                issueTitle: comp.title,
                volunteer: comp.assignedTo || 'Unknown Volunteer',
                statusChange: comp.statusChange || { from: 'In Progress', to: 'Resolved' },
                submittedDate: new Date(comp.updatedAt).toLocaleDateString(),
                proofPhoto: comp.photo ? 'Available' : 'None',
                notes: comp.workNotes || comp.description || '',
                resolution: 'Approving will set status to Resolved.'
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
        fetchPendingApprovals();
        fetchUpdates();
    }, [fetchPendingApprovals, fetchUpdates]);

    // ── Approve citizen complaint ────────────────────────────
    const handleApproveComplaint = async (complaintId) => {
        if (processingApproval) return;
        if (!window.confirm('Approve this complaint? It will become visible in All Issues and can be assigned to a volunteer.')) return;

        setProcessingApproval(true);
        try {
            await axios.put(
                `${API_BASE_URL}/complaints/approve/${complaintId}`,
                { adminNote: 'Approved by admin.' },
                { withCredentials: true }
            );
            alert('Complaint approved! It is now visible in All Issues.');
            setPendingApprovals(prev => prev.filter(c => c._id !== complaintId));
        } catch (error) {
            alert('Approval failed: ' + (error.response?.data?.message || 'Server error.'));
        } finally {
            setProcessingApproval(false);
        }
    };

    // ── Reject citizen complaint ─────────────────────────────
    const handleRejectComplaint = async (complaintId) => {
        if (processingApproval) return;
        const reason = window.prompt('Provide a reason for rejection (required):');
        if (!reason || !reason.trim()) {
            if (reason !== null) alert('Rejection requires a reason.');
            return;
        }

        setProcessingApproval(true);
        try {
            await axios.put(
                `${API_BASE_URL}/complaints/reject/${complaintId}`,
                { adminNote: reason.trim() },
                { withCredentials: true }
            );
            alert('Complaint rejected.');
            setPendingApprovals(prev => prev.filter(c => c._id !== complaintId));
        } catch (error) {
            alert('Rejection failed: ' + (error.response?.data?.message || 'Server error.'));
        } finally {
            setProcessingApproval(false);
        }
    };

    // ── Approve volunteer resolution ─────────────────────────
    const handleApprove = async (updateId) => {
        if (processing || !window.confirm('Approve this resolution? Status will be set to RESOLVED.')) return;

        setProcessing(true);
        try {
            await axios.put(
                `${API_BASE_URL}/complaints/${updateId}`,
                { status: 'resolved', pendingUpdate: false },
                { withCredentials: true }
            );
            alert('Resolution approved! Issue is now Resolved.');
            setUpdates(updates.filter(u => u.id !== updateId));
        } catch (error) {
            alert('Approval failed: ' + (error.response?.data?.message || 'Server error.'));
        } finally {
            setProcessing(false);
        }
    };

    // ── Reject volunteer resolution ──────────────────────────
    const handleReject = async (updateId) => {
        if (processing) return;
        const reason = window.prompt('Provide a reason for rejection (required):');
        if (reason && reason.trim()) {
            setProcessing(true);
            try {
                await axios.put(
                    `${API_BASE_URL}/complaints/${updateId}`,
                    { status: 'in progress', rejectionNote: reason, pendingUpdate: false },
                    { withCredentials: true }
                );
                alert('Resolution rejected. Issue reset to In Progress.');
                setUpdates(updates.filter(u => u.id !== updateId));
            } catch (error) {
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
                            {/* Show badge if there are pending approvals */}
                            {pendingApprovals.length > 0 && (
                                <span style={{
                                    background: '#e74c3c', color: 'white',
                                    borderRadius: '50%', fontSize: 11, fontWeight: 700,
                                    padding: '1px 6px', marginLeft: 6
                                }}>
                                    {pendingApprovals.length}
                                </span>
                            )}
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

                {/* ── SECTION 1: Pending Citizen Complaints ───────────── */}
                <div className="updates-page-header">
                    <h1 className="updates-page-title">
                        Pending Citizen Complaints
                        {pendingApprovals.length > 0 && (
                            <span style={{
                                background: '#e74c3c', color: 'white',
                                borderRadius: 20, fontSize: 13, fontWeight: 700,
                                padding: '2px 10px', marginLeft: 12
                            }}>
                                {pendingApprovals.length} new
                            </span>
                        )}
                    </h1>
                    <p className="updates-page-subtitle">
                        Review and approve complaints submitted by citizens before they are assigned to volunteers
                    </p>
                </div>

                {approvalsLoading && (
                    <div className="loading-message">
                        <Loader2 size={24} className="spinner" /> Loading pending complaints...
                    </div>
                )}
                {approvalsError && <div className="error-message">{approvalsError}</div>}

                <div className="updates-list">
                    {!approvalsLoading && pendingApprovals.length === 0 && !approvalsError && (
                        <div className="no-updates-message">
                            <CheckCircle size={32} />
                            <p>No pending citizen complaints awaiting approval.</p>
                        </div>
                    )}

                    {pendingApprovals.map((complaint) => (
                        <div key={complaint._id} className="update-card">
                            <div className="update-header">
                                <div className="update-title-section">
                                    <AlertCircle size={16} className="update-icon" />
                                    <h3 className="update-title">{complaint.title}</h3>
                                </div>
                                <span className="volunteer-name">
                                    <User size={13} style={{ marginRight: 4 }} />
                                    Reported by {complaint.userId?.name || 'Unknown'}
                                </span>
                            </div>

                            <div className="update-body">
                                <div className="volunteer-notes-section">
                                    <div className="notes-label">Description:</div>
                                    <p className="notes-text">{complaint.description}</p>
                                </div>

                                <div className="update-meta">
                                    <div className="meta-item">
                                        <Calendar size={14} />
                                        <span className="meta-label">Submitted</span>
                                        <span className="meta-value">
                                            {new Date(complaint.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="meta-item">
                                        <MapPin size={14} />
                                        <span className="meta-label">Location</span>
                                        <span className="meta-value">
                                            {complaint.address?.[0] || 'Not specified'}
                                        </span>
                                    </div>
                                    <div className="meta-item">
                                        <FileImage size={14} />
                                        <span className="meta-label">Photo</span>
                                        <span className="meta-value">
                                            {complaint.photo
                                                ? <a href={complaint.photo} target="_blank" rel="noreferrer">View Photo</a>
                                                : 'No photo'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="update-actions">
                                <button
                                    className="action-btn approve-btn"
                                    onClick={() => handleApproveComplaint(complaint._id)}
                                    disabled={processingApproval}
                                >
                                    <CheckCircle size={16} />
                                    {processingApproval ? <Loader2 size={16} className="spinner" /> : 'Approve'}
                                </button>
                                <button
                                    className="action-btn reject-btn"
                                    onClick={() => handleRejectComplaint(complaint._id)}
                                    disabled={processingApproval}
                                >
                                    <XCircle size={16} />
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── SECTION 2: Volunteer Resolution Updates ─────────── */}
                <div className="updates-page-header" style={{ marginTop: 48 }}>
                    <h1 className="updates-page-title">Volunteer Resolution Updates</h1>
                    <p className="updates-page-subtitle">
                        Review and approve status updates submitted by volunteers
                    </p>
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
                            <p>No pending volunteer updates requiring review.</p>
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
