import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
    LayoutDashboard, AlertCircle, Users, Clock,
    CheckCircle, XCircle, ArrowRight, Loader2,
    Image as ImageIcon, FileText, MapPin,
    User as UserIcon, Calendar, Tag, UserCheck,
    ZoomIn, X, ChevronRight
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

// ── Photo Lightbox ──────────────────────────────────────────────────────────
const PhotoLightbox = ({ src, onClose }) => (
    <div
        style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        onClick={onClose}
    >
        <button onClick={onClose} style={{
            position: 'absolute', top: 20, right: 28,
            background: 'none', border: 'none', color: '#fff',
            cursor: 'pointer', fontSize: 32, lineHeight: 1, zIndex: 10
        }}>✕</button>
        <img
            src={src}
            alt="Proof"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
        />
    </div>
);

// ── Resolution Detail Side Panel ────────────────────────────────────────────
const ResolutionPanel = ({ item, onClose, onApprove, onReject }) => {
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [proofImgError, setProofImgError] = useState(false);
    const [origImgError, setOrigImgError] = useState(false);

    if (!item) return null;

    const address = Array.isArray(item.address)
        ? item.address.join(', ')
        : (item.address || '—');
    const volunteerName = DEPARTMENTS.includes(item.assignedTo) ? '—' : (item.assignedTo || '—');

    const handleApprove = async () => {
        if (!window.confirm(`Approve resolution for "${item.title}"?\n\nThis will mark the issue as Resolved and notify the citizen.`)) return;
        setApproving(true);
        try {
            await axios.put(
                `${API_BASE_URL}/complaints/approve-resolution/${item._id}`,
                {},
                { withCredentials: true }
            );
            onApprove(item._id);
            onClose();
        } catch (err) {
            alert('Approval failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setApproving(false);
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectNote.trim()) {
            alert('Please enter a reason so the volunteer knows what to fix.');
            return;
        }
        setRejecting(true);
        try {
            await axios.put(
                `${API_BASE_URL}/complaints/reject-resolution/${item._id}`,
                { rejectionNote: rejectNote.trim() },
                { withCredentials: true }
            );
            onReject(item._id);
            onClose();
        } catch (err) {
            alert('Rejection failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setRejecting(false);
        }
    };

    return (
        <>
            {lightboxSrc && <PhotoLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

            <div className="detail-overlay" onClick={onClose} />
            <div className="detail-panel">

                <div className="detail-panel-header">
                    <div>
                        <p className="detail-panel-eyebrow">Resolution Approval Request</p>
                        <h2 className="detail-panel-title">{item.title}</h2>
                    </div>
                    <button className="detail-close-btn" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="detail-panel-body">

                    <div className="detail-badges">
                        <span className="detail-status-badge" style={{
                            background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa'
                        }}>
                            ● Awaiting Your Approval
                        </span>
                    </div>

                    {/* PROOF PHOTO — shown prominently first */}
                    <div className="detail-section">
                        <div className="detail-section-heading">
                            <ImageIcon size={14} /> Volunteer Proof Photo
                        </div>
                        {item.proofPhoto && !proofImgError ? (
                            <div
                                style={{ position: 'relative', cursor: 'zoom-in', marginTop: 8 }}
                                onClick={() => setLightboxSrc(item.proofPhoto)}
                            >
                                <img
                                    src={item.proofPhoto}
                                    alt="Proof of work"
                                    style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 220, display: 'block' }}
                                    onError={() => setProofImgError(true)}
                                />
                                <div style={{
                                    position: 'absolute', bottom: 8, right: 8,
                                    background: 'rgba(0,0,0,0.55)', borderRadius: 6,
                                    padding: '3px 8px', display: 'flex', alignItems: 'center',
                                    gap: 4, color: '#fff', fontSize: 11, fontWeight: 600
                                }}>
                                    <ZoomIn size={11} /> Click to enlarge
                                </div>
                            </div>
                        ) : (
                            <div className="detail-no-photo" style={{ marginTop: 8 }}>
                                <ImageIcon size={28} color="#9ca3af" />
                                <span>No proof photo uploaded by volunteer</span>
                            </div>
                        )}
                    </div>

                    {item.workNotes && (
                        <div className="detail-section">
                            <div className="detail-section-heading"><FileText size={14} /> Volunteer Work Notes</div>
                            <p className="detail-section-text">{item.workNotes}</p>
                        </div>
                    )}

                    <div className="detail-info-grid">
                        <div className="detail-info-row">
                            <UserIcon size={14} className="detail-info-icon" />
                            <span className="detail-info-label">Reported By</span>
                            <span className="detail-info-value">{item.userId?.name || '—'}</span>
                        </div>
                        <div className="detail-info-row">
                            <UserCheck size={14} className="detail-info-icon" />
                            <span className="detail-info-label">Volunteer</span>
                            <span className="detail-info-value">{volunteerName}</span>
                        </div>
                        <div className="detail-info-row">
                            <Calendar size={14} className="detail-info-icon" />
                            <span className="detail-info-label">Reported On</span>
                            <span className="detail-info-value">{new Date(item.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="detail-info-row">
                            <Clock size={14} className="detail-info-icon" />
                            <span className="detail-info-label">Submitted On</span>
                            <span className="detail-info-value">{new Date(item.updatedAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="detail-info-row">
                            <Tag size={14} className="detail-info-icon" />
                            <span className="detail-info-label">Department</span>
                            <span className="detail-info-value">{item.assignedTo || '—'}</span>
                        </div>
                        {address && (
                            <div className="detail-info-row full">
                                <MapPin size={14} className="detail-info-icon" />
                                <span className="detail-info-label">Location</span>
                                <span className="detail-info-value">{address}</span>
                            </div>
                        )}
                    </div>

                    {item.description && (
                        <div className="detail-section">
                            <div className="detail-section-heading"><FileText size={14} /> Original Complaint</div>
                            <p className="detail-section-text">{item.description}</p>
                        </div>
                    )}

                    {item.photo && !origImgError && (
                        <div className="detail-section">
                            <div className="detail-section-heading">
                                <ImageIcon size={14} /> Original Photo (for comparison)
                            </div>
                            <img
                                src={item.photo}
                                alt="Original complaint"
                                style={{ width: '100%', borderRadius: 8, marginTop: 8, objectFit: 'cover', maxHeight: 160, display: 'block', cursor: 'zoom-in' }}
                                onError={() => setOrigImgError(true)}
                                onClick={() => setLightboxSrc(item.photo)}
                            />
                        </div>
                    )}

                    <div className="detail-divider" />

                    {/* APPROVE / REJECT ACTIONS */}
                    {!showRejectForm ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <button
                                onClick={handleApprove}
                                disabled={approving}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 8, padding: '12px 0', borderRadius: 8, border: 'none',
                                    background: approving ? '#86efac' : '#16a34a',
                                    color: '#fff', fontWeight: 700, fontSize: 14,
                                    cursor: approving ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {approving
                                    ? <><Loader2 size={15} className="spinner" /> Approving...</>
                                    : <><CheckCircle size={15} /> Approve — Mark Issue as Resolved</>
                                }
                            </button>
                            <button
                                onClick={() => setShowRejectForm(true)}
                                disabled={approving}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 8, padding: '12px 0', borderRadius: 8,
                                    border: '1.5px solid #fca5a5', background: '#fff1f2',
                                    color: '#be123c', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                                }}
                            >
                                <XCircle size={15} /> Reject & Send Back to Volunteer
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div className="detail-section-heading">
                                <XCircle size={14} /> Reason for Rejection
                            </div>
                            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                                This will be shown to the volunteer so they know exactly what needs to be fixed.
                            </p>
                            <textarea
                                rows={3}
                                placeholder="e.g. Photo is unclear, the work is incomplete, please redo and resubmit..."
                                value={rejectNote}
                                onChange={e => setRejectNote(e.target.value)}
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    padding: '9px 12px', borderRadius: 7,
                                    border: '1.5px solid #fca5a5',
                                    fontSize: 13, resize: 'vertical', fontFamily: 'inherit'
                                }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={handleRejectSubmit}
                                    disabled={rejecting}
                                    style={{
                                        flex: 1, padding: '11px 0', borderRadius: 8, border: 'none',
                                        background: rejecting ? '#fda4af' : '#be123c',
                                        color: '#fff', fontWeight: 700, fontSize: 14,
                                        cursor: rejecting ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {rejecting ? <><Loader2 size={14} className="spinner" /> Rejecting...</> : 'Confirm Rejection'}
                                </button>
                                <button
                                    onClick={() => { setShowRejectForm(false); setRejectNote(''); }}
                                    style={{
                                        padding: '11px 18px', borderRadius: 8,
                                        border: '1.5px solid #d1d5db', background: '#fff',
                                        fontSize: 14, cursor: 'pointer', color: '#374151', fontWeight: 500
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// ── Main Page Component ─────────────────────────────────────────────────────
const AdminIssuesUpdates = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    const [pendingItems, setPendingItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) { signOut(); navigate('/'); }
    };

    const getUserInitials = (name) => {
        if (!name) return 'AD';
        return name.split(' ').map(p => p[0]).join('').toUpperCase();
    };

    const fetchPending = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/complaints/pending-requests`, { withCredentials: true });
            setPendingItems(res.data.data || []);
        } catch (err) {
            setError('Failed to load pending requests. Please try again.');
            console.error(err.message);
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
        if (!user) { navigate('/login'); return; }
        if (user.role !== 'admin') { navigate('/dashboard'); return; }
        fetchPending();
    }, [user, navigate, fetchPending, authChecked]);

    const handleApprove = (id) => setPendingItems(prev => prev.filter(i => i._id !== id));
    const handleReject = (id) => setPendingItems(prev => prev.filter(i => i._id !== id));

    if (!authChecked || !user) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Loader2 size={24} className="spinner" />
        </div>
    );

    return (
        <div className={`all-issues-admin ${selectedItem ? 'has-panel' : ''}`}>

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
                        <Link to="/admin-all-issues" className="admin-nav-link"><AlertCircle size={18} /> All Issues</Link>
                        <Link to="/admin-users-volunteers" className="admin-nav-link"><Users size={18} /> Users & Volunteers</Link>
                        <Link to="/admin-issues-updates" className="admin-nav-link active">
                            <Clock size={18} /> Issue Updates
                            {pendingItems.length > 0 && (
                                <span style={{
                                    background: '#ef4444', color: '#fff', borderRadius: '50%',
                                    fontSize: 11, fontWeight: 700, padding: '1px 6px', marginLeft: 4,
                                    minWidth: 18, textAlign: 'center', display: 'inline-block'
                                }}>
                                    {pendingItems.length}
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
                    <button onClick={handleLogout} className="logout-btn-header"><ArrowRight size={20} /></button>
                </div>
            </header>

            <div className="main-content">
                <div className="issues-hero">
                    <div className="issues-hero-content">
                        <Clock size={36} />
                        <h1>Resolution Approval Requests</h1>
                        <p>Volunteers have marked these issues as resolved. Review the proof photo, then approve or reject.</p>
                    </div>
                </div>

                <div className="issues-stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                    {[
                        { label: 'Awaiting Review', value: pendingItems.length, bg: '#ffedd5', icon: Clock, iconColor: '#f97316' },
                        { label: 'With Proof Photo', value: pendingItems.filter(i => i.proofPhoto).length, bg: '#dcfce7', icon: ImageIcon, iconColor: '#16a34a' },
                        { label: 'No Photo', value: pendingItems.filter(i => !i.proofPhoto).length, bg: '#fff7ed', icon: AlertCircle, iconColor: '#f97316' },
                    ].map((s, idx) => {
                        const Icon = s.icon;
                        return (
                            <div key={idx} className="issues-stat-card">
                                <div className="issues-stat-content">
                                    <div className="issues-stat-info">
                                        <div className="issues-stat-label">{s.label}</div>
                                        <div className="issues-stat-value">{s.value}</div>
                                    </div>
                                    <div className="issues-stat-icon" style={{ backgroundColor: s.bg }}>
                                        <Icon size={24} color={s.iconColor} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="issues-table-section">
                    <div className="issues-table-header">
                        <div className="issues-table-title">
                            <Clock size={20} />
                            <h2>Pending Volunteer Resolutions</h2>
                        </div>
                        <p className="issues-table-subtitle">Click any row to view the proof photo and take action</p>
                    </div>

                    <div className="issues-table-container">
                        {loading ? (
                            <div className="loading-state-admin">
                                <div className="loading-spinner" />
                                <p>Loading pending requests...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state-admin">
                                <AlertCircle size={24} color="#ef4444" />
                                <p>{error}</p>
                                <button onClick={fetchPending} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer', background: '#fff', fontSize: 13 }}>
                                    Retry
                                </button>
                            </div>
                        ) : pendingItems.length === 0 ? (
                            <div className="empty-state-admin" style={{ padding: '60px 24px', textAlign: 'center' }}>
                                <CheckCircle size={44} color="#22c55e" style={{ marginBottom: 14 }} />
                                <p style={{ fontSize: 17, fontWeight: 700, color: '#374151', marginBottom: 6 }}>All caught up!</p>
                                <p style={{ color: '#9ca3af', fontSize: 14 }}>No volunteer resolutions waiting for your approval right now.</p>
                            </div>
                        ) : (
                            <table className="issues-table">
                                <thead>
                                    <tr>
                                        <th>Issue Title</th>
                                        <th>Volunteer</th>
                                        <th>Reported By</th>
                                        <th>Proof Photo</th>
                                        <th>Submitted</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingItems.map(item => {
                                        const isActive = selectedItem?._id === item._id;
                                        const volName = DEPARTMENTS.includes(item.assignedTo) ? '—' : (item.assignedTo || '—');
                                        return (
                                            <tr
                                                key={item._id}
                                                className={`issue-row ${isActive ? 'issue-row-active' : ''}`}
                                                onClick={() => setSelectedItem(item)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td className="issue-title-cell">{item.title}</td>
                                                <td><span className="assigned-name-text">{volName}</span></td>
                                                <td>{item.userId?.name || 'Anonymous'}</td>
                                                <td>
                                                    {item.proofPhoto ? (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                                                            <ImageIcon size={12} /> Photo uploaded
                                                        </span>
                                                    ) : (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff7ed', color: '#c2410c', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                                                            <AlertCircle size={12} /> No photo
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{new Date(item.updatedAt).toLocaleDateString('en-IN')}</td>
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

            {selectedItem && (
                <ResolutionPanel
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            )}
        </div>
    );
};

export default AdminIssuesUpdates;