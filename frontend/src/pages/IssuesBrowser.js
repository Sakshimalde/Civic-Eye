import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Search, Filter, MapPin, ArrowRight, BarChart3, Users, FileText, PlusCircle, Heart, MessageSquare, Eye, Clock, ChevronsDown, ThumbsDown, Edit, Save } from 'lucide-react'; 
import './IssuesBrowser.css';

const API_BASE_URL = 'http://localhost:3000/api/v1'; // Define API URL

// --- Time utility ---
const getRelativeTime = (isoDateString) => {
    const reportDate = new Date(isoDateString);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfReportDay = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
    const diffTime = startOfToday.getTime() - startOfReportDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        const hoursDiff = Math.floor((today.getTime() - reportDate.getTime()) / (1000 * 60 * 60));
        if (hoursDiff === 0) return 'Just now';
        if (hoursDiff < 24) return `${hoursDiff} hours ago`;
        return 'Today';
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
};

const getUserInitials = (name) => {
    if (!name) return 'JD';
    const nameParts = name.split(' ');
    const initials = nameParts.map(part => part[0]).join('');
    return initials.toUpperCase();
};

const UserBrowseIssue = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [authChecked, setAuthChecked] = useState(false);
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        category: 'All Categories',
        status: 'All Statuses',
        sort: 'Newest First'
    });
    // userVotes state is crucial for persistent coloring
    const [userVotes, setUserVotes] = useState({});
    const [commentsOpen, setCommentsOpen] = useState({});
    const [commentsStore, setCommentsStore] = useState({});
    const [commentDrafts, setCommentDrafts] = useState({});
    const [busyComments, setBusyComments] = useState({});
    // State to manage voting action busy status
    const [busyVotes, setBusyVotes] = useState({}); 

    // Consistent state name
    const [editingComment, setEditingComment] = useState(null); 

    const categories = useMemo(() => [
        'All Categories', 'Garbage & Waste', 'Potholes', 'Water Issues', 'Street Lights', 'Vandalism', 'Other'
    ], []);

    const statusOptions = useMemo(() => [
        'All Statuses', 'Pending', 'In Progress', 'Resolved'
    ], []);

    const sortOptions = useMemo(() => [
        'Newest First', 'Oldest First', 'Most Voted', 'Most Viewed', 'Priority'
    ], []);

    const issueCategories = useMemo(() => [
        { category: 'Garbage & Waste', count: 0, icon: '🗑️', color: '#E53E3E' },
        { category: 'Potholes', count: 0, icon: '🕳️', color: '#DD6B20' },
        { category: 'Water Issues', count: 0, icon: '💧', color: '#3182CE' },
        { category: 'Street Lights', count: 0, icon: '💡', color: '#D69E2E' },
        { category: 'Vandalism', count: 0, icon: '🎨', color: '#805AD5' },
        { category: 'Other', count: 0, icon: '📋', color: '#718096' },
    ], []);

    const communityImpact = {
        issuesResolved: '0',
        responseTime: '2 days avg',
        communityScore: '%',
        activeUsers: '1',
        totalReports: '2'
    };

    const fetchIssues = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const params = {
            search: searchTerm.trim(),
            category: filters.category,
            status: filters.status,
            sort: filters.sort,
        };

        try {
            const response = await axios.get(`${API_BASE_URL}/complaints/all`, {
                params: params,
                withCredentials: true
            });

            const fetchedIssues = response.data.data.map(comp => {
                const statusText = comp.status === 'recived' ? 'Pending' : comp.status === 'inReview' ? 'In Progress' : comp.status === 'resolved' ? 'Resolved' : 'Pending';
                const locationText = comp.address?.[0] || 'Unknown Location';
                
                const userName = typeof comp.userId === 'object' && comp.userId?.name
                    ? comp.userId.name
                    : 'Anonymous User';

                const reverseCategoryMap = {
                    'Municipal sanitation and public health': 'Garbage & Waste',
                    'Roads and street infrastructure': 'Potholes',
                    'Street lighting and electrical assets': 'Street Lights',
                    'Water, sewerage, and stormwater': 'Water Issues',
                    'Ward/zone office and central admin': 'Vandalism'
                };
                const displayCategory = reverseCategoryMap[comp.assignedTo] || 'Other';

                return {
                    id: comp._id,
                    title: comp.title,
                    description: comp.description,
                    location: locationText,
                    category: displayCategory,
                    status: statusText,
                    createdAt: comp.createdAt,
                    votes: 0, 
                    comments: comp.comments?.length || 0,
                    views: Math.floor(Math.random() * 200),
                    priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
                    urgency: 'Community Concern',
                    user: userName,
                    userAvatar: getUserInitials(userName),
                    counts: { upvote: 0, downVote: 0 } 
                };
            });

            // Fetch user-specific vote status
            const issueIds = fetchedIssues.map(i => i.id).join(',');
            let userVotesMap = {};
            if (issueIds.length > 0) {
                try {
                    const userVotesResp = await axios.get(`${API_BASE_URL}/votes/user-votes`, {
                        params: { issues: issueIds },
                        withCredentials: true
                    });
                    userVotesMap = userVotesResp.data.data || {};
                } catch (err) {
                    console.warn("Failed to fetch user votes on load:", err.response?.data || err.message);
                }
            }
            // ⭐ This is the key step that ensures the 'voted' class is set on load
            setUserVotes(userVotesMap); 

            // Fetch overall vote counts
            const countsPromises = fetchedIssues.map(i =>
                axios.get(`${API_BASE_URL}/votes/${i.id}`, { withCredentials: true })
                    .then(r => ({ id: i.id, counts: r.data.data }))
                    .catch(() => ({ id: i.id, counts: { upvote: 0, downVote: 0 } }))
            );

            const countsResults = await Promise.all(countsPromises);
            const countsMap = countsResults.reduce((acc, item) => { acc[item.id] = item.counts; return acc; }, {});
            const issuesWithCounts = fetchedIssues.map(i => ({ ...i, counts: countsMap[i.id] || { upvote: 0, downVote: 0 } }));
            
            setIssues(issuesWithCounts);
            setFilteredIssues(issuesWithCounts);

        } catch (error) {
            console.error("Failed to fetch issues:", error.response?.data || error.message);
            setIssues([]);
            setFilteredIssues([]);
        } finally {
            setLoading(false);
        }
    }, [user, searchTerm, filters]);

    useEffect(() => {
        const checkAuthStatus = async () => {
            // Wait briefly for AuthContext to resolve the user state on refresh
            await new Promise(resolve => setTimeout(resolve, 50)); 
            setAuthChecked(true);
        };
        checkAuthStatus();
    }, []);

    // ⭐ FIX 1: Corrected useEffect logic for authentication and page reload
    useEffect(() => {
        if (!authChecked) return;
        
        // If user object is null/undefined after auth check, redirect to login
        if (!user) {
            navigate('/login');
        } else {
            // If user object exists, stay on the page and fetch data
            fetchIssues();
        }
    }, [user, navigate, fetchIssues, authChecked]);

    // --- VOTE Handler (Upvote & Downvote) ---
    const handleVote = async (issueId, voteType) => {
        if (!user) {
            alert("Please login to vote.");
            return;
        }
        
        const currentUserVote = userVotes[issueId]; 
        
        // Prevent rapid clicks
        if (busyVotes[issueId]) return;

        let endpoint = `${API_BASE_URL}/votes/${issueId}?category=${voteType}`;
        
        setBusyVotes(prev => ({ ...prev, [issueId]: true }));

        // Optimistic Update: Calculate new counts and new user vote state immediately
        const updatedIssuesOptimistic = issues.map(issue => {
            if (issue.id !== issueId) return issue;
            const counts = { ...issue.counts };
            const prevUserVote = currentUserVote;

            // 1. Remove previous vote
            if (prevUserVote === 'upvote') counts.upvote = Math.max(0, counts.upvote - 1);
            if (prevUserVote === 'downvote') counts.downVote = Math.max(0, counts.downVote - 1);

            let newUserVote;
            if (prevUserVote === voteType) {
                newUserVote = undefined; // toggled off (vote deleted)
            } else {
                // 2. Add new vote (new vote set or changed)
                if (voteType === 'upvote') counts.upvote = (counts.upvote || 0) + 1;
                else counts.downVote = (counts.downVote || 0) + 1;
                newUserVote = voteType;
            }

            return { ...issue, counts, _newUserVote: newUserVote }; 
        });

        // Apply the new user vote state permanently
        const newUserVoteState = updatedIssuesOptimistic.reduce((acc, issue) => {
            if (issue.id === issueId) {
                acc[issue.id] = issue._newUserVote;
            } else if (userVotes.hasOwnProperty(issue.id)) {
                acc[issue.id] = userVotes[issue.id];
            }
            delete issue._newUserVote;
            return acc;
        }, {});

        // This optimistic update immediately changes the button's appearance (color/disabled state)
        setUserVotes(newUserVoteState); 
        setIssues(updatedIssuesOptimistic);
        setFilteredIssues(updatedIssuesOptimistic);

        try {
            const resp = await axios.post(endpoint, {}, { withCredentials: true });
            
            const returned = resp.data.data;
            const returnedCounts = returned?.counts || resp.data.data; 

            if (returnedCounts) {
                setIssues(prev => prev.map(i => i.id === issueId ? { ...i, counts: returnedCounts } : i));
                setFilteredIssues(prev => prev.map(i => i.id === issueId ? { ...i, counts: returnedCounts } : i));
            }

        } catch (error) {
            console.error("Vote action failed:", error.response?.data || error.message);
            // Rollback visual state by re-fetching on error
            fetchIssues(); 
            alert(`Vote action failed: ${error.response?.data?.message || 'Check network/server logic.'}`);
        } finally {
            // Restore busy state regardless of success/failure
            setBusyVotes(prev => ({ ...prev, [issueId]: false }));
        }
    };


    // --- Comments: fetch for a single complaint ---
    const fetchComments = async (complaintId) => {
        setCommentsOpen(prev => ({ ...prev, [complaintId]: true }));
        if (commentsStore[complaintId]) return; 

        try {
            const resp = await axios.get(`${API_BASE_URL}/comments/${complaintId}`, { withCredentials: true });
            setCommentsStore(prev => ({ ...prev, [complaintId]: resp.data.data }));
        } catch (err) {
            console.error("Failed to fetch comments", err.response?.data || err.message);
            setCommentsStore(prev => ({ ...prev, [complaintId]: [] }));
        }
    };

    const toggleComments = (complaintId) => {
        const isOpen = !!commentsOpen[complaintId];
        if (!isOpen) {
            fetchComments(complaintId);
        } else {
            setCommentsOpen(prev => ({ ...prev, [complaintId]: false }));
        }
    };

    const handleCommentChange = (issueId, value) => {
        setCommentDrafts(prev => ({ ...prev, [issueId]: value }));
    };

    const deleteComment = async (issueId, commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;

        const prevComments = commentsStore[issueId] || [];

        // Optimistic removal
        setCommentsStore(prev => ({
            ...prev,
            [issueId]: prev[issueId].filter(c => c._id !== commentId)
        }));

        try {
            await axios.delete(`${API_BASE_URL}/comments/${issueId}/${commentId}`, { withCredentials: true });

            // decrement comment count
            setIssues(prev => prev.map(i => i.id === issueId ? { ...i, comments: (i.comments || 1) - 1 } : i));
            setFilteredIssues(prev => prev.map(i => i.id === issueId ? { ...i, comments: (i.comments || 1) - 1 } : i));
        } catch (err) {
            console.error("Failed to delete comment:", err.response?.data || err.message);
            alert("Failed to delete comment");
            // rollback
            setCommentsStore(prev => ({ ...prev, [issueId]: prevComments }));
        }
    };

    // --- Start Editing Comment (Corrected to use 'editingComment') ---
    const startEditComment = (comment) => {
        setEditingComment({
            commentId: comment._id,
            content: comment.content
        });
    };

    // --- Update Comment Handler (FINAL FIX for consistency and state atomicity) ---
    const updateComment = async (issueId, commentId, newContent) => {
        const trimmedContent = newContent.trim();
        // Use editingComment state for comparison
        if (!trimmedContent || trimmedContent === (editingComment?.content || '')) {
            setEditingComment(null); // Cancel if empty or unchanged
            return;
        }

        setBusyComments(prev => ({ ...prev, [commentId]: true }));
        const currentComment = commentsStore[issueId].find(c => c._id === commentId);
        const prevContent = currentComment?.content;
        const prevUpdatedAt = currentComment?.updatedAt; // Capture original timestamp for rollback

        // 1. Optimistic update (Crucial: Retain the existing populated `userId` object)
        setCommentsStore(prev => ({
            ...prev,
            [issueId]: prev[issueId].map(c => 
                c._id === commentId 
                    ? { 
                        ...c, 
                        content: trimmedContent, 
                        // Simulate an update timestamp. Use a new Date string.
                        updatedAt: new Date().toISOString(), 
                        userId: currentComment.userId 
                    } 
                    : c
            )
        }));
        setEditingComment(null); // Exit edit mode immediately

        try {
            // 2. API call to update the comment
            // The URL path must match the backend route: /comments/:complaintId/:commentId
            const resp = await axios.put(`${API_BASE_URL}/comments/${issueId}/${commentId}`, { content: trimmedContent }, { withCredentials: true });
            const updated = resp.data.data; 

            // 3. Final update from server response (atomic replacement)
            setCommentsStore(prev => ({
                ...prev,
                [issueId]: prev[issueId].map(c => c._id === commentId ? updated : c)
            }));
        } catch (err) {
            console.error("Failed to update comment", err.response?.data || err.message);
            alert("Failed to update comment. Rolling back.");
            
            // 4. Rollback on error
            setCommentsStore(prev => ({
                ...prev,
                [issueId]: prev[issueId].map(c => 
                    c._id === commentId ? { ...c, content: prevContent, updatedAt: prevUpdatedAt } : c
                )
            }));
            
            // 5. Re-open edit state with old content for user to retry
            setEditingComment({ commentId, content: prevContent });
        } finally {
            setBusyComments(prev => ({ ...prev, [commentId]: false }));
        }
    };

    const postComment = useCallback(async (issueId) => {
        const text = (commentDrafts[issueId] || '').trim();
        if (!text) return alert("Comment can't be empty");
        setBusyComments(prev => ({ ...prev, [issueId]: true }));

        // --- Include current user details for optimistic comment and correct display ---
        const tempComment = {
            _id: `temp-${Date.now()}`,
            // Populate userId as an object so the comment item can display the name correctly
            userId: { _id: user._id, name: user.name }, 
            complaintId: issueId,
            content: text,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // -------------------------------------------------------------------------------------

        setCommentsStore(prev => ({ 
            ...prev, 
            [issueId]: [tempComment, ...(prev[issueId] || [])] 
        }));
        setCommentDrafts(prev => ({ ...prev, [issueId]: "" }));

        try {
            const resp = await axios.post(`${API_BASE_URL}/comments/${issueId}`, { content: text }, { withCredentials: true });
            const created = resp.data.data;

            // Replace temp comment with actual
            setCommentsStore(prev => ({
                ...prev,
                [issueId]: prev[issueId].map(c => c._id === tempComment._id ? created : c)
            }));

            // increment comment count on issue
            setIssues(prev => prev.map(i => i.id === issueId ? { ...i, comments: (i.comments || 0) + 1 } : i));
            setFilteredIssues(prev => prev.map(i => i.id === issueId ? { ...i, comments: (i.comments || 0) + 1 } : i));
        } catch (err) {
            console.error("Failed to post comment", err.response?.data || err.message);
            // rollback optimistic append
            setCommentsStore(prev => ({ ...prev, [issueId]: (prev[issueId] || []).filter(c => c._id !== tempComment._id) }));
            alert("Failed to post comment");
        } finally {
            setBusyComments(prev => ({ ...prev, [issueId]: false }));
        }
    }, [commentDrafts, user]); 

    // --- Other Handlers ---
    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleLogout = () => {
        axios.post(`${API_BASE_URL}/users/logout`, {}, { withCredentials: true })
            .catch(() => { })
            .finally(() => {
                signOut();
                navigate('/');
            });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilters({
            category: 'All Categories',
            status: 'All Statuses',
            sort: 'Newest First'
        });
    };

    if (!authChecked) {
        return (
            <div className="loading-state full-page-loading">
                <div className="loading-spinner"></div>
                <p>Checking authentication status...</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <>
            {/* Header */}
            <header className="header-top">
                
                <nav className="nav-links">
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/browse-issues" className="active">Browse Issues</Link>
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
                {/* Hero */}
                <div className="dashboard-hero">
                    <div className="hero-background"></div>
                    <div className="hero-content-wrapper">
                        <div className="hero-badge">Community Platform</div>
                        <h1>Discover & Support Local Issues</h1>
                        <p>Join thousands of community members in identifying, voting, and resolving neighborhood concerns. Together we build better communities.</p>
                        <div className="hero-stats">
                            <div className="hero-stat">
                                <strong>{communityImpact.totalReports}</strong>
                                <span>Issues Reported</span>
                            </div>
                            <div className="hero-stat">
                                <strong>{communityImpact.issuesResolved}</strong>
                                <span>Issues Resolved</span>
                            </div>
                            <div className="hero-stat">
                                <strong>{communityImpact.activeUsers}</strong>
                                <span>Active Members</span>
                            </div>
                        </div>
                        <div className="hero-buttons">
                            <button className="hero-btn-primary" onClick={() => navigate('/report-issue')}>
                                <PlusCircle size={18} />
                                <span>Report New Issue</span>
                            </button>
                            <button className="hero-btn-secondary" onClick={() => navigate('/dashboard')}>
                                <span>View Dashboard</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="browse-issues-main">
                    <div className="browse-sidebar">
                        {/* Sidebar content */}
                        <div className="sidebar-panel">
                            <div className="panel-header">
                                <BarChart3 size={20} className="panel-icon" />
                                <h4>Issue Categories</h4>
                            </div>
                            <p className="panel-subtitle">Browse by issue type</p>
                            <div className="categories-list">
                                {issueCategories.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`category-item ${filters.category === item.category ? 'active' : ''}`}
                                        onClick={() => handleFilterChange('category', item.category)}
                                    >
                                        <div className="category-icon-title">
                                            <span
                                                className="category-icon"
                                                style={{ backgroundColor: item.color }}
                                            >
                                                {item.icon}
                                            </span>
                                            <span className="category-title">{item.category}</span>
                                        </div>
                                        <span
                                            className="category-count"
                                            style={{ backgroundColor: item.color }}
                                        >
                                            {issues.filter(i => i.category === item.category).length}
                                        </span>
                                    </div>
                                ))}
                                <div
                                    className={`category-item ${filters.category === 'All Categories' ? 'active' : ''}`}
                                    onClick={() => handleFilterChange('category', 'All Categories')}
                                >
                                    <div className="category-icon-title">
                                        <span className="category-title">All Categories</span>
                                    </div>
                                    <span className="category-count">{issues.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="sidebar-panel">
                            <div className="panel-header">
                                <Users size={20} className="panel-icon" />
                                <h4>Community Impact</h4>
                            </div>
                            <div className="impact-stats">
                                <div className="impact-stat-item">
                                    <div className="impact-icon">✅</div>
                                    <div className="impact-content">
                                        <strong>{communityImpact.issuesResolved}</strong>
                                        <span>Issues Resolved</span>
                                    </div>
                                </div>
                                <div className="impact-stat-item">
                                    <div className="impact-icon">⚡</div>
                                    <div className="impact-content">
                                        <strong>{communityImpact.responseTime}</strong>
                                        <span>Avg Response Time</span>
                                    </div>
                                </div>
                                <div className="impact-stat-item">
                                    <div className="impact-icon">⭐</div>
                                    <div className="impact-content">
                                        <strong>{communityImpact.communityScore}</strong>
                                        <span>Community Score</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="browse-content">
                        <div className="content-panel filter-panel">
                            <div className="panel-header-main">
                                <div className="panel-title">
                                    <Filter size={24} className="title-icon" />
                                    <div>
                                        <h3>Filter & Search Issues</h3>
                                        <p>Find and engage with community concerns</p>
                                    </div>
                                </div>
                                {(searchTerm || filters.category !== 'All Categories' || filters.status !== 'All Statuses') && (
                                    <button onClick={clearFilters} className="clear-filters-btn">
                                        <span>Clear All</span>
                                    </button>
                                )}
                            </div>

                            <div className="search-section">
                                <div className="search-bar">
                                    <Search size={20} className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search issues by title, description, location..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="search-input"
                                    />
                                    {searchTerm && (
                                        <button
                                            className="clear-search-btn"
                                            onClick={() => setSearchTerm('')}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="filter-controls">
                                <div className="filter-group">
                                    <label className="filter-label">
                                        <span className="filter-label-icon">📁</span>
                                        Category
                                    </label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => handleFilterChange('category', e.target.value)}
                                        className="filter-select"
                                    >
                                        {categories.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label className="filter-label">
                                        <span className="filter-label-icon">🔄</span>
                                        Status
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="filter-select"
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label className="filter-label">
                                        <span className="filter-label-icon">📊</span>
                                        Sort By
                                    </label>
                                    <select
                                        value={filters.sort}
                                        onChange={(e) => handleFilterChange('sort', e.target.value)}
                                        className="filter-select"
                                    >
                                        {sortOptions.map(option => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="results-info">
                                <div className="results-count">
                                    <strong>{filteredIssues.length}</strong>
                                    <span>{filteredIssues.length === 1 ? ' issue' : ' issues'} found</span>
                                </div>
                                <div className="community-engagement">
                                    <div className="engagement-badge">
                                        <span className="engagement-dot"></span>
                                        High Community Engagement
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Issues List */}
                        <div className="content-panel issues-panel">
                            <div className="panel-header-main">
                                <div className="panel-title">
                                    <FileText size={24} className="title-icon" />
                                    <div>
                                        <h3>Community Issues</h3>
                                        <p>Recent reports from your neighborhood</p>
                                    </div>
                                </div>
                                <div className="active-filters">
                                    {filters.category !== 'All Categories' && (
                                        <span className="active-filter-tag">Category: {filters.category}</span>
                                    )}
                                    {filters.status !== 'All Statuses' && (
                                        <span className="active-filter-tag">Status: {filters.status}</span>
                                    )}
                                    {filters.sort !== 'Newest First' && (
                                        <span className="active-filter-tag">Sorted by: {filters.sort}</span>
                                    )}
                                </div>
                            </div>

                            <div className="issues-list-container">
                                {loading ? (
                                    <div className="loading-state">
                                        <div className="loading-spinner"></div>
                                        <p>Loading community issues...</p>
                                        <span className="loading-subtitle">Fetching the latest reports from the server</span>
                                    </div>
                                ) : filteredIssues.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">🔍</div>
                                        <h3>No issues found</h3>
                                        <p>We couldn't find any issues matching your search criteria.</p>
                                        <button onClick={clearFilters} className="clear-filters-btn large">
                                            Clear All Filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="issues-grid">
                                        {filteredIssues.map(issue => (
                                            <div key={issue.id} className="issue-card">
                                                <div className="issue-header">
                                                    <div className="issue-meta-left">
                                                        <div
                                                            className="issue-category-tag"
                                                            style={{
                                                                backgroundColor: issueCategories.find(c => c.category === issue.category)?.color + '20',
                                                                color: issueCategories.find(c => c.category === issue.category)?.color
                                                            }}
                                                        >
                                                            {issue.category}
                                                        </div>
                                                        <div className={`priority-indicator priority-${issue.priority}`}>
                                                            <div className={`priority-dot priority-${issue.priority}`}></div>
                                                            {issue.priority} priority
                                                        </div>
                                                    </div>
                                                    <div className="issue-urgency">
                                                        {issue.urgency}
                                                    </div>
                                                </div>

                                                <h4 className="issue-title">{issue.title}</h4>
                                                <p className="issue-description">{issue.description}</p>

                                                <div className="issue-meta">
                                                    <div className="meta-item">
                                                        <MapPin size={16} />
                                                        <span>{issue.location}</span>
                                                    </div>
                                                    <div className="meta-item">
                                                        <Clock size={16} />
                                                        <span>{getRelativeTime(issue.createdAt)}</span>
                                                    </div>
                                                </div>

                                                <div className="issue-footer">
                                                    <div className="user-info">
                                                        <div className="user-avatar-small">
                                                            {issue.userAvatar}
                                                        </div>
                                                        <div className="user-details">
                                                            <span className="user-name">{issue.user}</span>
                                                            <span className="report-time">{getRelativeTime(issue.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="issue-actions">
                                                    <div className="vote-section">
                                                        {/* Upvote */}
                                                        <button
                                                            className={`vote-btn upvote ${userVotes[issue.id] === 'upvote' ? 'voted' : ''}`}
                                                            onClick={() => handleVote(issue.id, 'upvote')}
                                                            // ⭐ FIX 2: Disable if already upvoted OR busy. This is the logic to stop re-voting the same type.
                                                            disabled={userVotes[issue.id] === 'upvote' || busyVotes[issue.id]}
                                                        >
                                                            <Heart size={16} />
                                                            <span>{issue.counts?.upvote || 0}</span>
                                                        </button>
                                                        {/* Downvote */}
                                                        <button
                                                            className={`vote-btn downvote ${userVotes[issue.id] === 'downvote' ? 'voted' : ''}`}
                                                            onClick={() => handleVote(issue.id, 'downvote')}
                                                            // ⭐ FIX 3: Disable if already downvoted OR busy.
                                                            disabled={userVotes[issue.id] === 'downvote' || busyVotes[issue.id]}
                                                        >
                                                            <ThumbsDown size={16} />
                                                            <span>{issue.counts?.downVote || 0}</span>
                                                        </button>
                                                    </div>

                                                    <div className={`status-badge status-${issue.status.replace(' ', '').toLowerCase()}`}>
                                                        {issue.status}
                                                    </div>
                                                </div>

                                                {/* Comments toggle */}
                                                <div className="comments-toggle">
                                                    <button className="comments-open-btn" onClick={() => toggleComments(issue.id)}>
                                                        <ChevronsDown size={14} /> {commentsOpen[issue.id] ? 'Hide' : 'Show'} Comments ({issue.comments || 0})
                                                    </button>
                                                </div>

                                                {/* Comments panel */}
                                                
                                                {commentsOpen[issue.id] && (
                                                    <div className="comments-panel">
                                                        {/* Add Comment */}
                                                        <div className="add-comment">
                                                            <textarea
                                                                placeholder="Write your comment..."
                                                                value={commentDrafts[issue.id] || ''}
                                                                onChange={(e) => handleCommentChange(issue.id, e.target.value)}
                                                                rows={2}
                                                            />
                                                            <div className="comment-actions">
                                                                <button onClick={() => postComment(issue.id)} disabled={busyComments[issue.id]}>
                                                                    {busyComments[issue.id] ? 'Posting...' : 'Post Comment'}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Comments List */}
                                                        {(commentsStore[issue.id] || []).map(c => {
                                                            // --- Use user name from populated userId object/temp object ---
                                                            const commenterName = c.userId?.name || 'User';
                                                            const isOwner = (c.userId?._id || c.userId) === user._id; 
                                                            const isEditing = editingComment?.commentId === c._id;

                                                            return (
                                                                <div key={c._id} className="comment-item">
                                                                    <div className="comment-avatar">{commenterName[0].toUpperCase()}</div>
                                                                    <div className="comment-body">
                                                                        {isEditing ? (
                                                                            <div className="edit-comment-area">
                                                                                <textarea
                                                                                    // Use the content from the editing state
                                                                                    value={editingComment.content}
                                                                                    onChange={(e) => setEditingComment(prev => ({ ...prev, content: e.target.value }))}
                                                                                    rows={3}
                                                                                />
                                                                                <div className="comment-actions">
                                                                                    <button
                                                                                        // Pass content from the editing state
                                                                                        onClick={() => updateComment(issue.id, c._id, editingComment.content)}
                                                                                        disabled={busyComments[c._id]}
                                                                                    >
                                                                                        <Save size={14} /> {busyComments[c._id] ? 'Saving...' : 'Save'}
                                                                                    </button>
                                                                                    <button className="cancel-edit-btn" onClick={() => setEditingComment(null)}>Cancel</button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <div className="comment-meta">
                                                                                    <span className="comment-author">{commenterName}</span>
                                                                                    <span className="comment-time">
                                                                                        {getRelativeTime(c.createdAt)} 
                                                                                        {/* Check if updatedAt is later than createdAt and looks like a valid date */}
                                                                                        {c.updatedAt && c.updatedAt.toString() !== c.createdAt.toString() && new Date(c.updatedAt) > new Date(c.createdAt) ? ' (edited)' : ''}
                                                                                    </span>
                                                                                    {isOwner && (
                                                                                        <div className="comment-owner-actions">
                                                                                            <button
                                                                                                className="delete-comment-btn"
                                                                                                onClick={() => deleteComment(issue.id, c._id)}
                                                                                            >
                                                                                                🗑️
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="comment-content">{c.content}</div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}

                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="footer">
                <div className="footer-column footer-logo-section">
                    
                    <p className="footer-tagline">Civic Engagement Platform</p>
                    <p>Empowering communities to report, track, and resolve civic issues through collaborative engagement between citizens and local authorities.</p>
                </div>
                <div className="footer-column">
                    <h4>Platform</h4>
                    <ul>
                        <li><a href="/">How it Works</a></li>
                        <li><a href="/">Features</a></li>
                        <li><a href="/">Pricing</a></li>
                        <li><a href="/">Mobile App</a></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Support</h4>
                    <ul>
                        <li><a href="/">Help Center</a></li>
                        <li><a href="/">Contact Us</a></li>
                        <li><a href="/">User Guide</a></li>
                        <li><a href="/">Community Forum</a></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Company</h4>
                    <ul>
                        <li><a href="/">About Us</a></li>
                        <li><a href="/">Careers</a></li>
                        <li><a href="/">Press Kit</a></li>
                        <li><a href="/">Blog</a></li>
                    </ul>
                </div>
            </footer>
        </>
    );
};

export default UserBrowseIssue;