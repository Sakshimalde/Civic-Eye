import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, MapPin, FileText, ArrowRight, BarChart3, Users, Mail, Phone, Globe, AlertCircle, Clock, CheckCircle, X } from 'lucide-react';
import './Dashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

const getRelativeTime = (isoDateString) => {
    const reportDate = new Date(isoDateString);
    const now = new Date();
    const diffMs = now.getTime() - reportDate.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    if (diffMinutes < 60) return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours} hours ago`;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfReportDay = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
    const diffDays = Math.floor((startOfToday.getTime() - startOfReportDay.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
};

const Dashboard = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [allComplaints, setAllComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    const {
        totalReports, pendingIssues, inProgressIssues, resolvedIssues, rejectedIssues,
        avgResponseTime, communityScore, recentReports, issueCategories
    } = useMemo(() => {
        let totals = {
            totalReports: allComplaints.length,
            pendingIssues: 0,
            inProgressIssues: 0,
            resolvedIssues: 0,
            rejectedIssues: 0,
        };

        const categoryCounts = {
            'Garbage & Waste': { count: 0, icon: '🗑️', color: '#E53E3E' },
            'Potholes':        { count: 0, icon: '🕳️', color: '#DD6B20' },
            'Water Issues':    { count: 0, icon: '💧', color: '#3182CE' },
            'Street Lights':   { count: 0, icon: '💡', color: '#D69E2E' },
            'Vandalism':       { count: 0, icon: '🎨', color: '#805AD5' },
            'Other':           { count: 0, icon: '📋', color: '#718096' },
        };

        const reverseCategoryMap = {
            'Municipal sanitation and public health': 'Garbage & Waste',
            'Roads and street infrastructure': 'Potholes',
            'Street lighting and electrical assets': 'Street Lights',
            'Water, sewerage, and stormwater': 'Water Issues',
            'Ward/zone office and central admin': 'Vandalism',
        };

        allComplaints.forEach(comp => {
            const status = (comp.status || '').toLowerCase().trim();
            const isRejected = comp.isRejected || false;

            if (isRejected) {
                totals.rejectedIssues++;
            } else if (status === 'resolved') {
                totals.resolvedIssues++;
            } else if (status === 'recived' || status === 'received') {
                totals.pendingIssues++;
            } else if (status === 'inreview' || status === 'in review' || status === 'in progress') {
                totals.inProgressIssues++;
            } else {
                totals.pendingIssues++;
            }

            const cat = reverseCategoryMap[comp.assignedTo] || 'Other';
            if (categoryCounts[cat]) categoryCounts[cat].count++;
        });

        const finalCategories = Object.keys(categoryCounts).map(cat => ({
            category: cat,
            count: categoryCounts[cat].count,
            icon: categoryCounts[cat].icon,
            color: categoryCounts[cat].color,
        }));

        const sortedReports = [...allComplaints]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

        const mappedRecentReports = sortedReports.map(comp => ({
            title: comp.title,
            location: comp.address?.[0] || 'Unknown Location',
            votes: comp.mockVotes || Math.floor(Math.random() * 30),
            time: getRelativeTime(comp.createdAt),
            status: comp.status === 'recived' ? 'Pending'
                : comp.status === 'inReview' ? 'In Progress'
                : comp.status === 'resolved' ? 'Resolved'
                : 'Pending',
        }));

        const resolvedWithDates = allComplaints.filter(
            c => (c.status || '').toLowerCase() === 'resolved' && c.createdAt && c.updatedAt
        );
        let avgResponseTime = 'N/A';
        if (resolvedWithDates.length > 0) {
            const totalMs = resolvedWithDates.reduce(
                (sum, c) => sum + (new Date(c.updatedAt) - new Date(c.createdAt)), 0
            );
            const avgDays = totalMs / resolvedWithDates.length / (1000 * 60 * 60 * 24);
            avgResponseTime = avgDays < 1
                ? `${Math.round(avgDays * 24)} hrs avg`
                : `${avgDays.toFixed(1)} days avg`;
        }

        const communityScore = totals.totalReports > 0
            ? `${Math.round((totals.resolvedIssues / totals.totalReports) * 100)}%`
            : 'N/A';

        return {
            ...totals,
            avgResponseTime,
            communityScore,
            recentReports: mappedRecentReports,
            issueCategories: finalCategories,
        };
    }, [allComplaints]);

    const fetchComplaints = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/complaints/all`, { withCredentials: true });
            const raw = res.data;
            let complaints = [];
            if (Array.isArray(raw)) complaints = raw;
            else if (Array.isArray(raw?.data)) complaints = raw.data;
            else if (Array.isArray(raw?.data?.data)) complaints = raw.data.data;
            else if (Array.isArray(raw?.complaints)) complaints = raw.complaints;
            else if (Array.isArray(raw?.result)) complaints = raw.result;
            else {
                const firstArray = Object.values(raw || {}).find(v => Array.isArray(v));
                if (firstArray) complaints = firstArray;
            }
            setAllComplaints(complaints);
        } catch (err) {
            console.error("Failed to fetch complaints:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to fetch complaints');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        setAuthChecked(true);
    }, []);

    useEffect(() => {
        if (authChecked && user) fetchComplaints();
        else if (authChecked && !user) navigate('/login');
    }, [user, authChecked, navigate, fetchComplaints]);

    const handleLogout = () => {
        axios.post(`${API_BASE_URL}/users/logout`, {}, { withCredentials: true })
            .catch(() => {})
            .finally(() => { signOut(); navigate('/'); });
    };

    const getUserInitials = (name) => {
        if (!name) return 'JD';
        return name.split(' ').map(part => part[0]).join('').toUpperCase();
    };

    if (!authChecked || loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '10px' }}>
                <div className="loading-spinner"></div>
                <p>{loading ? 'Loading dashboard data...' : 'Checking authentication...'}</p>
            </div>
        );
    }

    if (!user) return null;

    const statCards = [
        { label: 'Total Issues',  value: totalReports,     icon: BarChart3,   bg: '#e5e7eb' },
        { label: 'Pending',       value: pendingIssues,    icon: AlertCircle, bg: '#ffedd5' },
        { label: 'In Progress',   value: inProgressIssues, icon: Clock,       bg: '#dbeafe' },
        { label: 'Resolved',      value: resolvedIssues,   icon: CheckCircle, bg: '#dcfce7' },
        { label: 'Rejected',      value: rejectedIssues,   icon: X,           bg: '#fff1f2' },
    ];

    return (
        <>
            <header className="header-top">
                <div className="logo-section">
                    <div className="logo-text">CivicEye</div>
                </div>
                <nav className="nav-links">
                    <Link to="/dashboard" className="active">Dashboard</Link>
                    <Link to="/browse-issues">Browse Issues</Link>
                    <Link to="/report-issue">Report Issue</Link>
                </nav>
                <div className="user-profile">
                    <Link to="/profile" className="profile-link">
                        <div className="user-initials">{getUserInitials(user.name)}</div>
                        <span className="user-name">{user.name}</span>
                    </Link>
                    <button onClick={handleLogout} className="logout-btn-header">
                        <ArrowRight size={20} />
                    </button>
                </div>
            </header>

            <div className="dashboard-container">
                <div className="dashboard-hero">
                    <div className="hero-content-wrapper">
                        <h2>Welcome, {user.name.split(' ')[0]}!</h2>
                        <p>Together, we're making our community cleaner and safer. Monitor progress, track impact, and see how your contributions make a difference.</p>
                        <div className="hero-buttons">
                            <Link to="/report-issue" className="hero-btn-primary inline-flex items-center gap-2">
                                <PlusCircle size={16} />
                                Report A New Issue
                            </Link>
                            <Link to="/browse-issues" className="hero-btn-secondary inline-flex items-center gap-2">
                                Browse Issues
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── 5 Admin-style Stat Cards ── */}
                <div className="dashboard-stats-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                    {statCards.map(({ label, value, icon: Icon, bg }) => (
                        <div key={label} className="issues-stat-card">
                            <div className="issues-stat-content">
                                <div className="issues-stat-info">
                                    <div className="issues-stat-label">{label}</div>
                                    <div className="issues-stat-value">{value}</div>
                                </div>
                                <div className="issues-stat-icon" style={{ backgroundColor: bg }}>
                                    <Icon size={24} color="#6b7280" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="dashboard-main">
                    <aside className="dashboard-sidebar-panels">
                        {/* Issue Categories */}
                        <div className="panel issue-categories-panel">
                            <div className="panel-header">
                                <h3><BarChart3 size={20} /> Issue Categories</h3>
                            </div>
                            <p className="panel-subtitle">Current active issues by type</p>
                            <div className="categories-list">
                                {issueCategories.map((item, index) => (
                                    <div key={index} className="category-item">
                                        <div className="category-icon-title">
                                            <span className="category-icon" style={{ backgroundColor: item.color }}>
                                                {item.icon}
                                            </span>
                                            <span className="category-title">{item.category}</span>
                                        </div>
                                        <span className="category-count" style={{ backgroundColor: item.color }}>
                                            {item.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Community Impact */}
                        <div className="panel community-impact-panel">
                            <h3><Users size={20} /> Community Impact</h3>
                            <div className="impact-stats">
                                <div className="impact-stat-item">
                                    <div className="impact-icon">✅</div>
                                    <div className="impact-content">
                                        <strong>{resolvedIssues} <small>total</small></strong>
                                        <span>Issues Resolved</span>
                                    </div>
                                </div>
                                <div className="impact-stat-item">
                                    <div className="impact-icon">⚡</div>
                                    <div className="impact-content">
                                        <strong>{avgResponseTime}</strong>
                                        <span>Response Time</span>
                                    </div>
                                </div>
                                <div className="impact-stat-item">
                                    <div className="impact-icon">⭐</div>
                                    <div className="impact-content">
                                        <strong>{communityScore}</strong>
                                        <span>Community Score</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="dashboard-content-panels">
                        <div className="panel recent-reports-panel">
                            <div className="panel-header">
                                <h3><FileText size={20} /> Recent Community Reports</h3>
                                <Link to="/browse-issues" className="view-all">View All <ArrowRight size={16} /></Link>
                            </div>
                            <p className="panel-subtitle">Latest issues reported by the community</p>
                            <div className="reports-list">
                                {recentReports.length > 0 ? (
                                    recentReports.map((report, index) => (
                                        <div key={index} className="report-card">
                                            <div className="report-details">
                                                <h4 className="report-title">{report.title}</h4>
                                                <div className="report-meta">
                                                    <MapPin size={16} /> {report.location}
                                                </div>
                                                <div className="report-info">
                                                    <span className={`status-label status-${report.status.replace(/\s/g, '').toLowerCase()}`}>{report.status}</span>
                                                    <span className="report-votes">{report.votes} votes</span>
                                                    <span className="report-time">{report.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state-dashboard">
                                        <p>No recent reports found. Be the first to <Link to="/report-issue">report an issue</Link>!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="panel quick-actions-panel">
                            <h3><PlusCircle size={20} /> Quick Actions</h3>
                            <div className="actions-grid">
                                <div className="action-card primary">
                                    <button onClick={() => navigate('/report-issue')}>
                                        <h4>Report Issue</h4>
                                        <p>Help improve your community</p>
                                    </button>
                                </div>
                                <div className="action-card secondary">
                                    <button onClick={() => navigate('/browse-issues')}>
                                        <h4>Browse Issues</h4>
                                        <p>See what others reported</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <footer className="footer">
                <div className="footer-column footer-logo-section">
                    <div className="logo-section">
                        <div className="logo-text">CivicEye</div>
                    </div>
                    <p className="footer-tagline">Civic Engagement Platform</p>
                    <p>Empowering communities to report, track, and resolve civic issues through collaborative engagement between citizens and local authorities.</p>
                    <div className="contact-info">
                        <p><Mail size={16} /> <a href="mailto:hello@civiceye.org">hello@civiceye.org</a></p>
                        <p><Phone size={16} /> <a href="tel:5551234567">(555) 123-4567</a></p>
                        <p><Globe size={16} /> <a href="http://www.civiceye.org" target="_blank" rel="noopener noreferrer">www.civiceye.org</a></p>
                    </div>
                </div>
                <div className="footer-column">
                    <h4>Platform</h4>
                    <ul>
                        <li><Link to="/how-it-works">How it Works</Link></li>
                        <li><Link to="/features">Features</Link></li>
                        <li><Link to="/pricing">Pricing</Link></li>
                        <li><Link to="/mobile-app">Mobile App</Link></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Support</h4>
                    <ul>
                        <li><Link to="/help-center">Help Center</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><Link to="/user-guide">User Guide</Link></li>
                        <li><Link to="/community-forum">Community Forum</Link></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Company</h4>
                    <ul>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/careers">Careers</Link></li>
                        <li><Link to="/press">Press Kit</Link></li>
                        <li><Link to="/blog">Blog</Link></li>
                    </ul>
                </div>
            </footer>
        </>
    );
};

export default Dashboard;