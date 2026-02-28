import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
    LayoutDashboard, AlertCircle, Users, Clock,
    CheckCircle, BarChart3, Search, UserCheck, ArrowRight,
    User as UserIcon, Loader2, X, MapPin, Calendar, Tag,
    FileText, MessageSquare, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import './AdminAllIssues.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

const DEPARTMENTS = [
    "Municipal sanitation and public health",
    "Roads and street infrastructure",
    "Street lighting and electrical assets",
    "Water, sewerage, and stormwater",
    "Ward/zone office and central admin"
];

const mapStatus = (s) => {
    switch (s) {
        case 'recived':     return 'Pending';
        case 'inReview':    return 'In Review';
        case 'resolved':    return 'Resolved';
        case 'in progress': return 'In Progress';
        default:            return 'Pending';
    }
};

const statusColorMap = {
    'pending':     { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    'in review':   { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
    'resolved':    { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    'in progress': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    'rejected':    { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
};

// ── Issue Detail Panel ─────────────────────────────────────────────────────
const IssueDetailPanel = ({ issue, volunteers, onClose, onAssign, onReject }) => {
    const [selectedVolunteer, setSelectedVolunteer] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [fullData, setFullData] = useState(null);
    const [fetchingFull, setFetchingFull] = useState(false);
    const [imgError, setImgError] = useState(false);

    // Fetch full complaint from backend when panel opens — gets fresh photo URL
    useEffect(() => {
        if (!issue?.id) return;
        setFullData(null);
        setSelectedVolunteer('');
        setImgError(false);
        setFetchingFull(true);

        axios.get(`${API_BASE_URL}/complaints/detail/${issue.id}`, { withCredentials: true })
            .then(res => setFullData(res.data.data))
            .catch(err => console.error('Failed to fetch complaint detail:', err.message))
            .finally(() => setFetchingFull(false));
    }, [issue?.id]);

    if (!issue) return null;

    // Prefer live-fetched data over list data
    const photo        = fullData?.photo        || issue.photo;
    const description  = fullData?.description  || issue.description;
    const workNotes    = fullData?.workNotes     || issue.workNotes;
    const isRejected   = fullData?.isRejected    || issue.isRejected || false;
    const rejectionNote = fullData?.rejectionNote || issue.rejectionNote || '';
    const address      = fullData?.address
        ? (Array.isArray(fullData.address) ? fullData.address.join(', ') : fullData.address)
        : issue.address;

    const statusLabel = isRejected ? 'Rejected' : mapStatus(issue.rawStatus);
    const sc = isRejected
        ? statusColorMap['rejected']
        : (statusColorMap[statusLabel.toLowerCase()] || statusColorMap['pending']);

    const handleAssign = async () => {
        if (!selectedVolunteer) return;
        setAssigning(true);
        try {
            await axios.put(
                `${API_BASE_URL}/complaints/assign/${issue.id}`,
                { assignedTo: selectedVolunteer },
                { withCredentials: true }
            );
            onAssign(issue.id, selectedVolunteer);
            setSelectedVolunteer('');
            alert(`✅ Issue assigned to ${selectedVolunteer}`);
        } catch (err) {
            alert('Assignment failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setAssigning(false);
        }
    };

    const handleReject = async () => {
        const reason = window.prompt('Reason for rejecting this complaint (required — this will be shown to the citizen):');
        if (!reason?.trim()) return;
        setRejecting(true);
        try {
            await axios.put(
                `${API_BASE_URL}/complaints/${issue.id}`,
                { isRejected: true, rejectionNote: reason },
                { withCredentials: true }
            );
            onReject(issue.id, reason);
            onClose();
            alert('Complaint rejected. The citizen will be notified.');
        } catch (err) {
            alert('Reject failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setRejecting(false);
        }
    };

    return (
        <>
            <div className="detail-overlay" onClick={onClose} />
            <div className="detail-panel">
                {/* Header */}
                <div className="detail-panel-header">
                    <div>
                        <p className="detail-panel-eyebrow">Issue Details</p>
                        <h2 className="detail-panel-title">{issue.title}</h2>
                    </div>
                    <button className="detail-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="detail-panel-body">
                    {fetchingFull && (
                        <div className="detail-loading">
                            <Loader2 size={20} className="spinner" />
                            <span>Loading issue data...</span>
                        </div>
                    )}

                    {/* Rejected Banner */}
                    {isRejected && (
                        <div className="detail-rejected-banner">
                            <X size={16} />
                            <div>
                                <strong>This complaint was rejected by admin.</strong>
                                {rejectionNote && <p className="rejection-reason">Reason: {rejectionNote}</p>}
                            </div>
                        </div>
                    )}

                    {/* Status + Priority */}
                    <div className="detail-badges">
                        <span className="detail-status-badge"
                            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            ● {statusLabel}
                        </span>
                        <span className={`detail-priority-badge priority-${issue.priority}`}>
                            {issue.priority?.toUpperCase()} PRIORITY
                        </span>
                    </div>

                    {/* Photo — fetched fresh from backend */}
                    <div className="detail-photo-section">
                        {fetchingFull ? (
                            <div className="detail-no-photo">
                                <Loader2 size={24} className="spinner" />
                                <span>Loading photo...</span>
                            </div>
                        ) : photo && !imgError ? (
                            <img
                                src={photo}
                                alt="Issue"
                                className="detail-photo"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="detail-no-photo">
                                <ImageIcon size={32} color="#9ca3af" />
                                <span>No photo submitted</span>
                            </div>
                        )}
                    </div>

                    {/* Info Grid */}
                    <div className="detail-info-grid">
                        <div className="detail-info-row">
                            <UserIcon size={14} className="detail-info-icon" />
                            <span className="detail-info-label">Reported By</span>
                            <span className="detail-info-value">{issue.reportedBy}</span>
                        </div>
                        <div className="detail-info-row">
                            <Calendar size={14} className="detail-info-icon" />
                            <span className="detail-info-label">Date</span>
                            <span className="detail-info-value">{issue.date}</span>
                        </div>
                        <div className="detail-info-row">
                            <Tag size={14} className="detail-info-icon" />
                            <span className="detail-info-label">Department</span>
                            <span className="detail-info-value">{issue.category}</span>
                        </div>
                        <div className="detail-info-row">
                            <UserCheck size={14} className="detail-info-icon" />
                            <span className="detail-info-label">Assigned To</span>
                            <span className="detail-info-value">{issue.assignedTo || '—'}</span>
                        </div>
                        {address && (
                            <div className="detail-info-row full">
                                <MapPin size={14} className="detail-info-icon" />
                                <span className="detail-info-label">Location</span>
                                <span className="detail-info-value">{address}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {description && (
                        <div className="detail-section">
                            <div className="detail-section-heading">
                                <MessageSquare size={14} /> Description
                            </div>
                            <p className="detail-section-text">{description}</p>
                        </div>
                    )}

                    {/* Volunteer Notes */}
                    {workNotes && (
                        <div className="detail-section">
                            <div className="detail-section-heading">
                                <FileText size={14} /> Volunteer Notes
                            </div>
                            <p className="detail-section-text">{workNotes}</p>
                        </div>
                    )}

                    {/* Actions — hidden if already rejected */}
                    {!isRejected && (
                        <>
                            <div className="detail-divider" />

                            {/* Assign Volunteer */}
                            <div className="detail-section">
                                <div className="detail-section-heading">
                                    <UserCheck size={14} />
                                    {issue.assignedTo ? 'Reassign to Volunteer' : 'Assign to Volunteer'}
                                </div>
                                <div className="detail-assign-row">
                                    <select
                                        className="detail-volunteer-select"
                                        value={selectedVolunteer}
                                        onChange={(e) => setSelectedVolunteer(e.target.value)}
                                        disabled={assigning}
                                    >
                                        <option value="">Select a volunteer...</option>
                                        {volunteers.map(v => (
                                            <option key={v.id} value={v.name}>{v.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        className="detail-assign-btn"
                                        onClick={handleAssign}
                                        disabled={!selectedVolunteer || assigning}
                                    >
                                        {assigning
                                            ? <><Loader2 size={14} className="spinner" /> Assigning...</>
                                            : <><UserCheck size={14} /> Assign</>
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Reject */}
                            <div className="detail-section">
                                <button
                                    className="detail-reject-btn"
                                    onClick={handleReject}
                                    disabled={rejecting}
                                >
                                    {rejecting
                                        ? <><Loader2 size={14} className="spinner" /> Rejecting...</>
                                        : <><X size={14} /> Reject This Complaint</>
                                    }
                                </button>
                                <p className="detail-reject-hint">
                                    Rejecting stops all further processing and notifies the citizen with your reason.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────
const AllIssuesAdmin = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    const [allIssues, setAllIssues] = useState([]);
    const [allVolunteers, setAllVolunteers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [authChecked, setAuthChecked] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            signOut();
            navigate('/');
        }
    };

    const getUserInitials = (name) => {
        if (!name) return 'AD';
        return name.split(' ').map(p => p[0]).join('').toUpperCase();
    };

    const fetchVolunteers = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/users/list-all`, { withCredentials: true });
            setAllVolunteers(
                res.data.data
                    .filter(u => u.role === 'volunteer')
                    .map(v => ({ id: v._id, name: v.name, location: v.location }))
            );
        } catch (err) {
            console.error("Failed to fetch volunteers:", err.message);
        }
    }, []);

    const fetchIssues = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/complaints/all`, { withCredentials: true });
            const mapped = res.data.data.map(comp => {
                let assignedToName = comp.assignedTo;
                if (DEPARTMENTS.includes(assignedToName)) assignedToName = null;
                return {
                    id: comp._id,
                    title: comp.title,
                    description: comp.description || '',
                    photo: comp.photo || null,
                    rawStatus: comp.status,
                    isRejected: comp.isRejected || false,
                    rejectionNote: comp.rejectionNote || '',
                    statusLabel: comp.isRejected ? 'Rejected' : mapStatus(comp.status),
                    priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
                    assignedTo: assignedToName,
                    reportedBy: comp.userId?.name || 'Anonymous',
                    date: new Date(comp.createdAt).toLocaleDateString('en-IN'),
                    category: comp.assignedTo || 'General',
                    address: Array.isArray(comp.address) ? comp.address.join(', ') : (comp.address || ''),
                    workNotes: comp.workNotes || '',
                };
            });
            setAllIssues(mapped);
        } catch (err) {
            setError('Failed to fetch issues.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setAuthChecked(true), 50);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!authChecked) return;
        if (user) { fetchIssues(); fetchVolunteers(); }
        else navigate('/login');
    }, [user, navigate, fetchIssues, fetchVolunteers, authChecked]);

    const filteredIssues = useMemo(() => {
        if (!searchTerm) return allIssues;
        const q = searchTerm.toLowerCase();
        return allIssues.filter(i =>
            i.title.toLowerCase().includes(q) ||
            i.reportedBy.toLowerCase().includes(q) ||
            (i.assignedTo || '').toLowerCase().includes(q) ||
            i.statusLabel.toLowerCase().includes(q)
        );
    }, [allIssues, searchTerm]);

    const dynamicStats = useMemo(() => {
        const total = allIssues.length;
        const inProgress = allIssues.filter(i => i.rawStatus === 'in progress').length;
        const resolved = allIssues.filter(i => i.rawStatus === 'resolved' && !i.isRejected).length;
        const pending = allIssues.filter(i => i.rawStatus === 'recived' && !i.isRejected).length;
        return [
            { label: 'Total Issues', value: total, icon: BarChart3, color: '#e5e7eb' },
            { label: 'In Progress', value: inProgress, icon: Clock, color: '#dbeafe' },
            { label: 'Resolved', value: resolved, icon: CheckCircle, color: '#dcfce7' },
            { label: 'Pending', value: pending, icon: AlertCircle, color: '#ffedd5' },
        ];
    }, [allIssues]);

    const handleRowClick = (issue) => setSelectedIssue(issue);
    const handleClosePanel = () => setSelectedIssue(null);

    const handleAssignIssue = (issueId, volunteerName) => {
        setAllIssues(prev => prev.map(i => i.id === issueId ? { ...i, assignedTo: volunteerName } : i));
        setSelectedIssue(prev => prev?.id === issueId ? { ...prev, assignedTo: volunteerName } : prev);
    };

    const handleRejectIssue = (issueId, reason) => {
        setAllIssues(prev => prev.map(i =>
            i.id === issueId
                ? { ...i, isRejected: true, rejectionNote: reason, statusLabel: 'Rejected' }
                : i
        ));
    };

    if (!user && !authChecked) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Loader2 size={24} className="spinner" />
        </div>
    );
    if (!user) return null;

    return (
        <div className={`all-issues-admin ${selectedIssue ? 'has-panel' : ''}`}>
            <header className="admin-header">
                <div className="admin-header-left">
                    <div className="admin-logo">
                        <div className="admin-logo-text">
                            <div className="admin-logo-title">CivicEye</div>
                            <div className="admin-logo-subtitle">Civic Platform</div>
                        </div>
                    </div>
                    <nav className="admin-nav">
                        <Link to="/admin-dashboard" className="admin-nav-link"><LayoutDashboard size={18} /> Dashboard</Link>
                        <Link to="/admin-all-issues" className="admin-nav-link active"><AlertCircle size={18} /> All Issues</Link>
                        <Link to="/admin-users-volunteers" className="admin-nav-link"><Users size={18} /> Users & Volunteers</Link>
                        <Link to="/admin-issues-updates" className="admin-nav-link"><Clock size={18} /> Issue Updates</Link>
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

            <div className="main-content">
                <div className="issues-hero">
                    <div className="issues-hero-content">
                        <BarChart3 size={36} />
                        <h1>All Issues Management</h1>
                        <p>Click any row to review, assign a volunteer, or reject the complaint</p>
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
                        <p className="issues-table-subtitle">Click any row to review and take action</p>
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
                                <p>Loading issues...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state-admin">
                                <AlertCircle size={24} color="#ef4444" />
                                <p>{error}</p>
                            </div>
                        ) : filteredIssues.length === 0 ? (
                            <div className="empty-state-admin">
                                <Search size={24} color="#9ca3af" />
                                <p>No issues found.</p>
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
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredIssues.map((issue) => {
                                        const scKey = issue.isRejected ? 'rejected' : issue.statusLabel.toLowerCase();
                                        const sc = statusColorMap[scKey] || statusColorMap['pending'];
                                        const isActive = selectedIssue?.id === issue.id;
                                        return (
                                            <tr
                                                key={issue.id}
                                                className={`issue-row ${isActive ? 'issue-row-active' : ''} ${issue.isRejected ? 'issue-row-rejected' : ''}`}
                                                onClick={() => handleRowClick(issue)}
                                            >
                                                <td className="issue-title-cell">
                                                    {issue.title}
                                                    {issue.isRejected && <span className="rejected-inline-badge">Rejected</span>}
                                                </td>
                                                <td>
                                                    <span className="status-badge"
                                                        style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                                        {issue.statusLabel}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`priority-badge priority-${issue.priority}`}>
                                                        {issue.priority}
                                                    </span>
                                                </td>
                                                <td>
                                                    {issue.assignedTo
                                                        ? <span className="assigned-name-text">{issue.assignedTo}</span>
                                                        : <span className="unassigned-text">Unassigned</span>
                                                    }
                                                </td>
                                                <td>{issue.reportedBy}</td>
                                                <td>{issue.date}</td>
                                                <td className="chevron-cell">
                                                    <ChevronRight size={16} color={isActive ? '#5b6fa8' : '#d1d5db'} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {selectedIssue && (
                <IssueDetailPanel
                    issue={selectedIssue}
                    volunteers={allVolunteers}
                    onClose={handleClosePanel}
                    onAssign={handleAssignIssue}
                    onReject={handleRejectIssue}
                />
            )}
        </div>
    );
};

export default AllIssuesAdmin;