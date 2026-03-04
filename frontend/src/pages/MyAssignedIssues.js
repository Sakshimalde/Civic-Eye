import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 
import axios from 'axios';
import { 
    MapPin, Calendar, User, Edit, Award, X, CheckCircle, 
    Clock, Loader2, FileText, AlertTriangle, ArrowRight
} from 'lucide-react';
import './MyAssignedIssues.css'; 

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

// Maps backend department string → readable category name
const DEPARTMENT_CATEGORY_MAP = {
    "Municipal sanitation and public health": "Garbage & Waste",
    "Roads and street infrastructure":        "Potholes & Roads",
    "Street lighting and electrical assets":  "Street Lights",
    "Water, sewerage, and stormwater":        "Water Issues",
    "Ward/zone office and central admin":     "General / Admin",
};

// Returns readable category from a complaint object.
// After a volunteer is assigned, assignedTo becomes the volunteer's name,
// so we need a separate field. For now we store category on the issue title
// mapping — fall back to showing assignedTo only if it IS a department.
const getCategory = (issue) => {
    if (DEPARTMENT_CATEGORY_MAP[issue.assignedTo]) {
        return DEPARTMENT_CATEGORY_MAP[issue.assignedTo];
    }
    // assignedTo is already a volunteer name — category unknown from this field
    // show a sensible fallback
    return issue.category || "Community Issue";
};

const MyAssignedIssues = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth(); 

    const [issues, setIssues] = useState([]);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [updateForm, setUpdateForm] = useState({ 
        status: 'inReview', 
        proofPhoto: null, 
        workNotes: '' 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const fetchAssignedIssues = async () => {
            if (!user) return;
            try {
                const response = await axios.get(`${API_BASE_URL}/complaints/assigned`, {
                    withCredentials: true
                });
                setIssues(response.data.data.map(issue => ({
                    ...issue,
                    // Preserve the original department as 'category' before assignedTo gets overwritten by volunteer name
                    category: DEPARTMENT_CATEGORY_MAP[issue.assignedTo] || issue.category || "Community Issue",
                })) || []);
            } catch (error) {
                console.error("Error fetching assigned issues:", error);
                alert("Failed to load assigned issues.");
            } finally {
                setAuthChecked(true);
            }
        };
        fetchAssignedIssues();
    }, [user]);

    const stats = useMemo(() => [
        { label: 'Total Assigned',   value: issues.length,                                                               color: '#2c5292' },
        { label: 'In Progress',      value: issues.filter(i => i.status === 'inReview' || i.status === 'in progress').length, color: '#dd6b20' },
        { label: 'Pending Approval', value: issues.filter(i => i.pendingUpdate).length,                                  color: '#7c3aed' },
        { label: 'Resolved',         value: issues.filter(i => i.status === 'resolved').length,                          color: '#38a169' }
    ], [issues]);

    const handleUpdateClick = (issue) => {
        setSelectedIssue(issue);
        setUpdateForm({ status: 'inReview', proofPhoto: null, workNotes: issue.workNotes || '' });
        setShowUpdateModal(true);
    };

    const handleSubmitUpdate = async (e) => {
        e.preventDefault();
        if (!updateForm.workNotes.trim()) {
            alert("Please provide detailed work notes.");
            return;
        }
        if (updateForm.status === 'resolved' && !updateForm.proofPhoto) {
            alert("A proof photo is required when marking as resolved. The admin needs it to approve your resolution.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('status', updateForm.status);
            formData.append('workNotes', updateForm.workNotes);
            if (updateForm.proofPhoto) {
                formData.append('proofPhoto', updateForm.proofPhoto);
            }

            const response = await axios.put(
                `${API_BASE_URL}/complaints/update-status/${selectedIssue._id}`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true }
            );

            // ✅ Use server response to update local state — server sets pendingUpdate correctly
            const updatedData = response.data.data;
            setIssues(prev => prev.map(i =>
                i._id === selectedIssue._id ? { ...i, ...updatedData } : i
            ));

            const msg = updateForm.status === 'resolved'
                ? "✅ Resolution submitted! Waiting for admin to review your proof photo."
                : "Status updated successfully!";
            alert(msg);

            setShowUpdateModal(false);
            setSelectedIssue(null);
            setUpdateForm({ status: 'inReview', proofPhoto: null, workNotes: '' });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to submit update.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            signOut();
            navigate('/');
        }
    };

    const getUserInitials = (name) => {
        if (!name) return 'V';
        const parts = name.split(' ');
        return parts.length > 1 
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() 
            : parts[0][0].toUpperCase();
    };

    const getStatusLabel = (issue) => {
        if (issue.pendingUpdate) return 'Pending Approval';
        switch (issue.status) {
            case 'recived':     return 'Received';
            case 'inReview':    return 'In Review';
            case 'in progress': return 'In Progress';
            case 'resolved':    return 'Resolved';
            default:            return issue.status;
        }
    };

    const getStatusClass = (issue) => {
        if (issue.pendingUpdate)                           return 'status-pending-approval';
        if (issue.resolutionRejected && !issue.pendingUpdate) return 'status-rejected';
        switch (issue.status) {
            case 'recived':     return 'status-pending';
            case 'inReview':
            case 'in progress': return 'status-in-progress';
            case 'resolved':    return 'status-resolved';
            default:            return 'status-default';
        }
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'high':   return 'priority-high';
            case 'medium': return 'priority-medium';
            case 'low':    return 'priority-low';
            default:       return 'priority-medium';
        }
    };

    if (!authChecked) {
        return (
            <div className="loading-state full-page-loading">
                <Loader2 size={32} className="loading-spinner" />
                <p>Loading your assigned issues...</p>
            </div>
        );
    }

    return (
        <div className="my-assigned-container">
            {/* Header */}
            <header className="header-top">
                <nav className="nav-links">
                    <Link to="/volunteer">Dashboard</Link>
                    <Link to="/MyAssignedIssues" className="active">My Assigned Issues</Link>
                    <Link to="/volunteer-browser-issues">Browse Issues</Link>
                </nav>
                <div className="header-right">
                    <div className="user-info clickable-profile" onClick={() => navigate('/volunteer-profile')}>
                        <div className="user-initials">{getUserInitials(user.name)}</div>
                        <span className="user-name">{user.name}</span>
                    </div>
                    <button onClick={handleLogout} className="logout-btn-header" title="Logout">
                        <ArrowRight size={20} />
                    </button>
                </div>
            </header>

            <hr />

            <div className="assigned-hero">
                <div className="hero-content">
                    <Award size={32} className="hero-icon" />
                    <h1>My Active Assignments</h1>
                    <p>Issues currently assigned to you and ready for field work.</p>
                </div>
            </div>

            <hr />

            {/* Stats */}
            <div className="assigned-stats-container">
                {stats.map((stat, idx) => (
                    <div key={idx} className="assigned-stat-card">
                        <div className="stat-label">{stat.label}</div>
                        <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                        <div className="stat-indicator" style={{ backgroundColor: stat.color }}></div>
                    </div>
                ))}
            </div>

            <hr />

            {/* Issue List */}
            <div className="assignments-section">
                <div className="section-header">
                    <FileText size={20} />
                    <h2>Assigned Issues ({issues.length})</h2>
                </div>

                <div className="assignments-list">
                    {issues.length > 0 ? issues.map(issue => (
                        <div key={issue._id} className="assignment-card">
                            <div className="assignment-main">
                                <div className="assignment-header">
                                    <h3>{issue.title}</h3>
                                    <span className={`status-badge ${getStatusClass(issue)}`}>
                                        {getStatusLabel(issue)}
                                    </span>
                                    <span className={`priority-badge ${getPriorityColor(issue.priority)}`}>
                                        {issue.priority || 'medium'}
                                    </span>
                                </div>

                                <p>{issue.description}</p>

                                <div className="assignment-meta">
                                    <div className="meta-item"><MapPin size={14} /><span>{issue.address?.[0]}</span></div>
                                    <div className="meta-item"><Calendar size={14} /><span>Reported: {new Date(issue.createdAt).toLocaleDateString()}</span></div>
                                    <div className="meta-item"><User size={14} /><span>By: {issue.userId?.name}</span></div>
                                </div>

                                <div className="assignment-dates">Assigned To: {issue.assignedTo}</div>

                                {/* ✅ AWAITING APPROVAL BANNER — shown after volunteer submits resolved */}
                                {issue.pendingUpdate && (
                                    <div style={{
                                        marginTop: 12,
                                        background: '#fffbeb',
                                        border: '1.5px solid #fcd34d',
                                        borderRadius: 8,
                                        padding: '10px 14px',
                                        display: 'flex',
                                        gap: 10,
                                        alignItems: 'flex-start',
                                        fontSize: 13,
                                        color: '#92400e'
                                    }}>
                                        <Clock size={16} style={{ marginTop: 1, flexShrink: 0, color: '#d97706' }} />
                                        <div>
                                            <strong>Awaiting Admin Approval</strong>
                                            <div style={{ marginTop: 3, color: '#78350f' }}>
                                                Your resolution and proof photo have been submitted. 
                                                The admin will review and either approve or send it back to you.
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ✅ REJECTION BANNER — shown when admin rejects the resolution */}
                                {issue.resolutionRejected && !issue.pendingUpdate && (
                                    <div style={{
                                        marginTop: 12,
                                        background: '#fff1f2',
                                        border: '1.5px solid #fca5a5',
                                        borderRadius: 8,
                                        padding: '10px 14px',
                                        fontSize: 13,
                                        color: '#be123c'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 6 }}>
                                            <AlertTriangle size={15} />
                                            Resolution Rejected by Admin
                                        </div>
                                        <div>
                                            <strong>Reason: </strong>
                                            {issue.resolutionRejectionNote || 'No reason provided.'}
                                        </div>
                                        <div style={{ marginTop: 6, color: '#6b7280', fontSize: 12 }}>
                                            Please fix the issue and resubmit your resolution using the Update Status button.
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Disable update button while pending admin review */}
                            <button
                                className={`update-btn ${issue.status === 'resolved' && !issue.resolutionRejected ? 'resolved-btn' : ''}`}
                                onClick={() => handleUpdateClick(issue)}
                                disabled={issue.pendingUpdate || issue.status === 'resolved'}
                                title={
                                    issue.pendingUpdate ? 'Awaiting admin approval — cannot update yet' 
                                    : issue.status === 'resolved' ? 'This issue is resolved'
                                    : 'Update status'
                                }
                                style={{ 
                                    opacity: (issue.pendingUpdate || issue.status === 'resolved') ? 0.5 : 1, 
                                    cursor: (issue.pendingUpdate || issue.status === 'resolved') ? 'not-allowed' : 'pointer' 
                                }}
                            >
                                {issue.pendingUpdate
                                    ? <><Clock size={16} /> Awaiting Approval</>
                                    : <><Edit size={16} /> Update Status</>
                                }
                            </button>
                        </div>
                    )) : (
                        <div className="no-assignments-message">
                            <CheckCircle size={24} color="#38a169" />
                            <p>No active issues assigned currently.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Update Modal */}
            {showUpdateModal && selectedIssue && (
                <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-section">
                                <div className="modal-title-row">
                                    <Edit size={24} className="modal-title-icon" />
                                    <h3>Update Issue Status</h3>
                                </div>
                                <span className="modal-subtitle">Submit a status update for admin approval</span>
                            </div>
                            <button className="modal-close-btn" onClick={() => setShowUpdateModal(false)} disabled={isSubmitting}>
                                <X size={20} />
                            </button>
                        </div>

                        <form className="modal-body-wrapper" onSubmit={handleSubmitUpdate}>
                            {/* Issue Info */}
                            <div className="modal-section issue-info-section">
                                <div className="section-title-icon">
                                    <Clock size={20} /> <h4>Issue Information</h4>
                                </div>
                                <div className="info-grid">
                                    <div className="info-field">
                                        <label>Issue Title</label>
                                        <span className="info-value">{selectedIssue.title}</span>
                                    </div>
                                    <div className="info-field">
                                        <label>Category</label>
                                        <span className="info-value">{getCategory(selectedIssue)}</span>
                                    </div>
                                    <div className="info-field">
                                        <label>Volunteer Name</label>
                                        <span className="info-value">{user.name}</span>
                                    </div>
                                    <div className="info-field">
                                        <label>Current Status</label>
                                        <span className="info-value">{selectedIssue.status}</span>
                                    </div>
                                    <div className="info-field full-width">
                                        <label>Location</label>
                                        <span className="info-value">{selectedIssue.address?.[0]}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="modal-section status-update-section">
                                <div className="section-title-icon">
                                    <CheckCircle size={20} /> <h4>Status Update</h4>
                                </div>
                                <div className="form-field">
                                    <label>New Status *</label>
                                    <select
                                        className="form-select"
                                        value={updateForm.status}
                                        onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}
                                        required
                                    >
                                        <option value="inReview">In Review</option>
                                        <option value="resolved">Resolved (requires admin approval + proof photo)</option>
                                    </select>
                                    {updateForm.status === 'resolved' && (
                                        <small style={{ color: '#d97706', fontWeight: 500 }}>
                                            ⚠️ Submitting as resolved will send your proof photo to admin. Status won't change until they approve.
                                        </small>
                                    )}
                                </div>
                            </div>

                            {/* Documentation */}
                            <div className="modal-section documentation-section">
                                <div className="section-title-icon">
                                    <FileText size={20} /> <h4>Documentation</h4>
                                </div>
                                <div className="form-field">
                                    <label>
                                        Proof Photo
                                        {updateForm.status === 'resolved' && (
                                            <span style={{ color: '#ef4444', marginLeft: 4 }}>* Required for resolved</span>
                                        )}
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setUpdateForm({ ...updateForm, proofPhoto: e.target.files[0] })}
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '8px',
                                            marginTop: 4,
                                            border: '1.5px dashed #d1d5db',
                                            borderRadius: 6,
                                            fontSize: 13,
                                            cursor: 'pointer',
                                            background: '#f9fafb',
                                        }}
                                    />
                                    <small>Upload photo evidence of the completed work</small>
                                </div>
                                <div className="form-field">
                                    <label>Work Notes *</label>
                                    <textarea
                                        className="form-textarea"
                                        rows="4"
                                        placeholder="Describe the work performed and current status..."
                                        value={updateForm.workNotes}
                                        onChange={e => setUpdateForm({ ...updateForm, workNotes: e.target.value })}
                                        required
                                    />
                                    <small>Provide detailed information about the work completed</small>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                                    {isSubmitting
                                        ? <><Loader2 size={20} className="spinner" /> Submitting...</>
                                        : <><CheckCircle size={20} /> {updateForm.status === 'resolved' ? 'Submit for Admin Approval' : 'Update Status'}</>
                                    }
                                </button>
                                <button type="button" className="btn-cancel" onClick={() => setShowUpdateModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyAssignedIssues;