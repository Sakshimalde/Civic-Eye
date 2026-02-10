import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 
import axios from 'axios';
import { 
    MapPin, Calendar, User, LogOut, Edit, Award, X, CheckCircle, Clock, Loader2, FileText
} from 'lucide-react';
import './MyAssignedIssues.css'; 
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const API_BASE_URL =  `${BACKEND_URL}/api/v1`; 


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

    // --- Fetch assigned issues from backend ---
    useEffect(() => {
        const fetchAssignedIssues = async () => {
            if (!user) return;

            try {
                const response = await axios.get(`${API_BASE_URL}/complaints/assigned`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });

                const normalizedIssues = response.data.data.map(issue => ({
                    ...issue,
                    status: issue.status.toLowerCase()
                }));
                setIssues(normalizedIssues);
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
        { label: 'Total Assigned', value: issues.length, color: '#2c5292' },
        { label: 'In Progress', value: issues.filter(i => i.status === 'inReview').length, color: '#dd6b20' },
        { label: 'Completed (All Time)', value: issues.filter(i => i.status === 'resolved').length, color: '#38a169' }
    ], [issues]);

    const handleUpdateClick = (issue) => {
        setSelectedIssue(issue);
        setUpdateForm({
            status: issue.status || 'inReview',
            proofPhoto: null,
            workNotes: issue.workNotes || ''
        });
        setShowUpdateModal(true);
    };

    const handleSubmitUpdate = async (e) => {
        e.preventDefault();
        if (!updateForm.workNotes.trim()) {
            alert("Please provide detailed work notes.");
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
                { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${user.token}` } }
            );

            // Update the issue in local state
           setIssues(prevIssues => prevIssues.map(i =>
    i._id === selectedIssue._id 
        ? { 
            ...i, 
            status: updateForm.status, 
            workNotes: updateForm.workNotes,
            
        }
        : i
));


            alert("Status updated successfully!");
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
        return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : parts[0][0].toUpperCase();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'recived': return 'status-pending';
            case 'inReview': return 'status-in-progress';
            case 'resolved': return 'status-resolved';
            default: return 'status-default';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'priority-high';
            case 'medium': return 'priority-medium';
            case 'low': return 'priority-low';
            default: return 'priority-medium';
        }
    };

    if (!authChecked) {
        return (
            <div className="loading-state full-page-loading">
                <Loader2 size={32} className="loading-spinner" />
                <p>Checking authentication status...</p>
            </div>
        );
    }

    // const activeIssues = issues.filter(i => i.status !== 'resolved');
const activeIssues = issues; // Show everything

    return (
        <div className="my-assigned-container">
            {/* Header */}
            <header className="header-top">
                
                <nav className="nav-links">
                    <Link to="/volunteer-dashboard">Dashboard</Link>
                    <Link to="/MyAssignedIssues"className="active">My Assigned Issues</Link>
                    <Link to="/volunteer-browser-issues">Browse Issues</Link>
                </nav>
                <div className="header-right">
                    <div className="user-info clickable-profile" onClick={() => navigate('/volunteer-profile')}>
                        <div className="user-initials">{getUserInitials(user.name)}</div>
                        <span className="user-name">{user.name}</span>
                    </div>
                    <button onClick={handleLogout} className="logout-btn-header" title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <hr />

            {/* Hero */}
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

            {/* Active Assignments */}
            <div className="assignments-section">
                <div className="section-header">
                    <FileText size={20} />
                    <h2>Assigned Issues ({activeIssues.length})</h2>
                </div>
                <div className="assignments-list">
                    {activeIssues.length > 0 ? activeIssues.map(issue => (
                        <div key={issue._id} className="assignment-card">
                            <div className="assignment-main">
                                <div className="assignment-header">
                                    <h3>{issue.title}</h3>
                                    <span className={`status-badge ${getStatusColor(issue.status)}`}>
                                        {issue.status}
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
                                {/* {issue.pendingUpdate && (
                                    <div className="pending-notice"><Clock size={16} /> Update request pending admin review</div>
                                )} */}
                            </div>
                            <button
    className={`update-btn ${issue.status === 'resolved' ? 'resolved-btn' : ''}`}
    onClick={() => handleUpdateClick(issue)}
>
    <Edit size={16} /> Update Status
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
                                    <Edit size={24} className="modal-title-icon" /> {/* Added Edit icon */}
                                    <h3>Update Issue Status</h3>
                                </div>
                                <span className="modal-subtitle">Submit a status update request for admin approval</span>
                            </div>
                            <button className="modal-close-btn" onClick={() => setShowUpdateModal(false)} disabled={isSubmitting}><X size={20} /></button>
                        </div>

                        <form className="modal-body-wrapper" onSubmit={handleSubmitUpdate}> {/* Renamed class to modal-body-wrapper */}
                            
                            {/* 1. Issue Information (Top Section - Blue Background) */}
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
                                        <span className="info-value">{selectedIssue.assignedTo}</span>
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

                            {/* 2. Status Update (Middle Section - White Background) */}
                            <div className="modal-section status-update-section">
                                <div className="section-title-icon">
                                    <CheckCircle size={20} /> <h4>Status Update</h4>
                                </div>
                                <div className="form-field">
                                    <label>New Status *</label>
                                    <select
                                        className="form-select" // Use class from original CSS to style select
                                        value={updateForm.status}
                                        onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}
                                        required
                                    >
                                        <option value="recived">Received</option>
                                        <option value="inReview">In Review</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                    <small>Choose the appropriate status for this issue</small>
                                </div>
                            </div>

                            {/* 3. Documentation (Bottom Section - Light Green Background) */}
                            <div className="modal-section documentation-section">
                                <div className="section-title-icon">
                                    <FileText size={20} /> <h4>Documentation</h4>
                                </div>
                                <div className="form-field">
                                    <label>Proof Photo</label>
                                    <input type="file" className="form-file-input" accept="image/*" onChange={e => setUpdateForm({ ...updateForm, proofPhoto: e.target.files[0] })} />
                                    <small>Upload photo evidence of work completed (recommended)</small>
                                </div>
                                <div className="form-field">
                                    <label>Work Notes *</label>
                                    <textarea className="form-textarea" rows="4" value={updateForm.workNotes} onChange={e => setUpdateForm({ ...updateForm, workNotes: e.target.value })} required></textarea>
                                    <small>Provide detailed information about the work completed</small>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 size={20} className="spinner" /> 'Submitting...'</> : <><CheckCircle size={20} /> 'Submit for Approval'</>}
                                </button>
                                <button type="button" className="btn-cancel" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

                        

        </div>
    );
};

export default MyAssignedIssues;
