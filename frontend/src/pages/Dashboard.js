import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, MapPin, FileText, ArrowRight, BarChart3, Users, Mail, Phone, Globe, Trash2, Lightbulb, Droplet, Wrench } from 'lucide-react';
import './Dashboard.css';

const API_BASE_URL = 'http://localhost:3000/api/v1'; // Use the base URL for consistency

// --- Utility Functions (Reusing/Adapting logic from IssuesBrowser) ---

// Utility to calculate time difference in a user-friendly way
const getRelativeTime = (isoDateString) => {
    const reportDate = new Date(isoDateString);
    const now = new Date();
    const diffMs = now.getTime() - reportDate.getTime();
    
    // Convert to minutes
    const diffMinutes = Math.round(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    }

    // Convert to hours
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) {
        return `${diffHours} hours ago`;
    }

    // Convert to days, checking for calendar day difference
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfReportDay = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
    const diffDays = Math.floor((startOfToday.getTime() - startOfReportDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
};


// Map server categories to display categories
const mapServerCategory = (serverAssignedTo) => {
    const reverseCategoryMap = {
        'Municipal sanitation and public health': 'Garbage & Waste',
        'Roads and street infrastructure': 'Potholes',
        'Street lighting and electrical assets': 'Street Lights',
        'Water, sewerage, and stormwater': 'Water Issues',
        'Ward/zone office and central admin': 'Vandalism'
    };
    return reverseCategoryMap[serverAssignedTo] || 'Other';
};

// Map display categories to icons
const getCategoryIcon = (category) => {
    switch (category) {
        case 'Garbage & Waste': return <Trash2 size={24} />;
        case 'Potholes': return <Wrench size={24} />;
        case 'Water Issues': return <Droplet size={24} />;
        case 'Street Lights': return <Lightbulb size={24} />;
        default: return <FileText size={24} />;
    }
};

const Dashboard = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    
    // Renamed state to hold ALL fetched complaints for dashboard aggregation
    const [allComplaints, setAllComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState(null);
    
    // State to handle initial authentication check
    const [authChecked, setAuthChecked] = useState(false);

    // --- Dynamic Dashboard Data Calculation using useMemo ---
    
    // 1. Complaint Aggregation and Recent Reports
    const { totalReports, activeIssues, resolvedIssues, pendingIssues, recentReports, issueCategories } = useMemo(() => {
        let totals = {
            totalReports: allComplaints.length,
            activeIssues: 0,
            resolvedIssues: 0,
            pendingIssues: 0,
        };
        const categoryCounts = {
            'Garbage & Waste': { count: 0, icon: <Trash2 size={24} /> },
            'Potholes': { count: 0, icon: <Wrench size={24} /> },
            'Water Issues': { count: 0, icon: <Droplet size={24} /> },
            'Street Lights': { count: 0, icon: <Lightbulb size={24} /> },
            'Other': { count: 0, icon: <FileText size={24} /> },
        };

        allComplaints.forEach(comp => {
            const status = comp.status;
            const displayCategory = mapServerCategory(comp.assignedTo);

            // Tally status counts
            if (status === 'recived' || status === 'inReview') {
                totals.activeIssues++;
                if (status === 'recived') {
                    totals.pendingIssues++;
                }
            }
            if (status === 'resolved') {
                totals.resolvedIssues++;
            }
            
            // Tally category counts
            if (categoryCounts[displayCategory]) {
                categoryCounts[displayCategory].count++;
            } else {
                categoryCounts['Other'].count++;
            }
        });

        // Get the top 3 recent reports (sorted by creation time)
        const sortedReports = [...allComplaints]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

        const mappedRecentReports = sortedReports.map(comp => ({
            title: comp.title,
            // Use the first address entry or fallback
            location: comp.address?.[0] || 'Unknown Location', 
            // Mock data for now, actual votes should come from backend aggregation
            votes: comp.mockVotes || Math.floor(Math.random() * 30), 
            time: getRelativeTime(comp.createdAt),
            status: comp.status === 'recived' ? 'Pending' : comp.status === 'inReview' ? 'In Progress' : comp.status === 'resolved' ? 'Resolved' : 'Pending',
        }));
        
        // Convert category map back to array format for rendering
        const finalCategories = Object.keys(categoryCounts)
            .filter(cat => categoryCounts[cat].count > 0 || cat !== 'Other') // Hide 'Other' if count is zero
            .map(cat => ({
                category: cat,
                count: categoryCounts[cat].count,
                icon: categoryCounts[cat].icon,
            }));

        return {
            ...totals,
            recentReports: mappedRecentReports,
            issueCategories: finalCategories,
        };
    }, [allComplaints]);
    
    
    // --- API Fetch Function ---
    const fetchComplaints = useCallback(async () => {
        if (!user) return; // Should already be guarded by the useEffect below

        setLoading(true);
        try {
            // NOTE: We fetch ALL complaints to perform local aggregation for the dashboard stats
            const res = await axios.get(`${API_BASE_URL}/complaints/all`, {
                withCredentials: true,
            });
            
            // Simulate adding mock data (votes/views) since your current backend only returns basic complaint data
            const enrichedData = res.data.data.map(comp => ({
                ...comp,
                mockVotes: Math.floor(Math.random() * 30),
            }));

            setAllComplaints(enrichedData);
        } catch (err) {
            console.error("Failed to fetch complaints:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to fetch complaints');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // --- Authentication and Data Fetch Effects ---

    // 1. Initial Auth Check (to prevent flash of unauthenticated content)
    useEffect(() => {
        // Assume AuthContext performs the actual token check/user loading.
        // We simulate the check completion here.
        setAuthChecked(true); 
    }, []);

    // 2. Data Fetch
    useEffect(() => {
        if (authChecked && user) {
            fetchComplaints();
        } else if (authChecked && !user) {
             // If auth check is complete and no user, redirect to login
             navigate('/login');
        }
    }, [user, authChecked, navigate, fetchComplaints]);


    const handleLogout = () => {
        axios.post(`${API_BASE_URL}/users/logout`, {}, { withCredentials: true })
            .catch(() => {})
            .finally(() => {
                signOut();
                navigate('/');
            });
    };

    const getUserInitials = (name) => {
        if (!name) return 'JD';
        const nameParts = name.split(' ');
        const initials = nameParts.map(part => part[0]).join('');
        return initials.toUpperCase();
    };

    // --- Conditional Rendering ---
    
    if (!authChecked || loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '10px' }}>
                <div className="loading-spinner"></div>
                <p>{loading ? 'Loading dashboard data...' : 'Checking authentication...'}</p>
            </div>
        );
    }
    
    if (!user) {
        // This case should primarily be handled by the useEffect redirect, but remains as a guard
        return null;
    }


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

                <div className="dashboard-stats-row">
                    <div className="stat-card total-reports-card">
                        {/* FIX: Use a flex container to align text and icon */}
                        <div className="stat-content-wrapper">
                            <div className="stat-info-text">
                                <h3 className="stat-value">{totalReports}</h3>
                                <p className="stat-label">Total Reports</p>
                            </div>
                            <div className="stat-icon-container">
                                <span className="stat-icon">📈</span>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card active-issues-card">
                        <div className="stat-content-wrapper">
                            <div className="stat-info-text">
                                <h3 className="stat-value">{activeIssues}</h3>
                                <p className="stat-label">Active Issues</p>
                            </div>
                            <div className="stat-icon-container">
                                <span className="stat-icon">🔥</span>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card resolved-card">
                        <div className="stat-content-wrapper">
                            <div className="stat-info-text">
                                <h3 className="stat-value">{resolvedIssues}</h3>
                                <p className="stat-label">Resolved Issues</p>
                            </div>
                            <div className="stat-icon-container">
                                <span className="stat-icon">✅</span>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card pending-card">
                        <div className="stat-content-wrapper">
                            <div className="stat-info-text">
                                <h3 className="stat-value">{pendingIssues}</h3>
                                <p className="stat-label">Pending Issues</p>
                            </div>
                            <div className="stat-icon-container">
                                <span className="stat-icon">⏳</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="dashboard-main">
                    <aside className="dashboard-sidebar-panels">
                        <div className="panel issue-categories-panel">
                            <div className="panel-header">
                                <h3><BarChart3 size={20} /> Issue Categories</h3>
                            </div>
                            <p className="panel-subtitle">Current active issues by type</p>
                            <div className="categories-list">
                                {issueCategories.map((item, index) => (
                                    <div key={index} className="category-item">
                                        <div className="category-icon-title">
                                            <span className="category-icon">{item.icon}</span>
                                            <span className="category-title">{item.category}</span>
                                        </div>
                                        <span className="category-count">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="panel community-impact-panel">
                            <h3><Users size={20} /> Community Impact</h3>
                            <div className="impact-stats">
                                <div className="impact-stat-item">
                                    <span>Issues Resolved</span>
                                    {/* Using resolvedIssues count for dynamic data */}
                                    <strong>{resolvedIssues} <small>total</small></strong>
                                </div>
                                <div className="impact-stat-item">
                                    <span>Response Time</span>
                                    <strong>N/A <small>avg</small></strong>
                                </div>
                                <div className="impact-stat-item">
                                    <span>Community Score</span>
                                    <strong>N/A</strong>
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
