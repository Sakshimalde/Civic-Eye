// AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, AlertCircle, Users, FileText, 
  Clock, CheckCircle, TrendingUp, Timer, ThumbsUp,
  Bell, LogOut, Settings,ArrowRight
} from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin') {
      navigate('/dashboard'); // Redirect non-admin users
    }
  }, [user, navigate]);

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

  // Dashboard stats
  const stats = [
    { 
      label: 'Total Issues', 
      value: '1', 
      icon: AlertCircle, 
      color: '#f933b7ff',
      bgColor: '#dbeafe'
    },
    { 
      label: 'Pending Review', 
      value: '1', 
      icon: Clock, 
      color: '#f97316',
      bgColor: '#ffedd5'
    },
    { 
      label: 'Resolved', 
      value: '0', 
      icon: CheckCircle, 
      color: '#22c55e',
      bgColor: '#dcfce7'
    },
    { 
      label: 'Active Users', 
      value: '4', 
      icon: Users, 
      color: '#5555f7ff',
      bgColor: '#f3e8ff'
    }
  ];

  // System overview metrics
  const systemMetrics = [
    {
      label: 'Resolution Rate',
      value: '1',
      icon: TrendingUp,
      iconColor: '#22c55e'
    },
    {
      label: 'Avg Response',
      value: '1',
      icon: Timer,
      iconColor: '#3b82f6'
    },
    {
      label: 'Satisfaction',
      value: '4',
      icon: ThumbsUp,
      iconColor: '#f59e0b'
    }
  ];

  // Administrative tools
  const adminTools = [
    {
      title: 'All Issues',
      description: 'Manage system-wide issues',
      icon: AlertCircle,
      bgColor: '#dbeafe',
      iconColor: '#3b82f6',
      route: '/admin/all-issues'
    },
    {
      title: 'Users & Volunteers',
      description: 'Manage user accounts',
      icon: Users,
      bgColor: '#dcfce7',
      iconColor: '#22c55e',
      route: '/admin/users-volunteers'
    },
    {
      title: 'Issue Updates',
      description: 'Approve status changes',
      icon: Clock,
      bgColor: '#ffedd5',
      iconColor: '#f97316',
      route: '/admin/issue-updates'
    }
  ];

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-dashboard">
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
            <Link to="/admin-dashboard" className="admin-nav-link active">
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link to="/admin-all-issues" className="admin-nav-link">
              <AlertCircle size={18} />
              All Issues
            </Link>
            <Link to="/admin-users-volunteers" className="admin-nav-link">
              <Users size={18} />
              Users & Volunteers
            </Link>
            {/* <Link to="/admin-requests" className="admin-nav-link">
              <FileText size={18} />
              Admin Requests
            </Link> */}
            {/* <Link to="/admin-issues-updates" className="admin-nav-link">
              <Clock size={18} />
              Issue Updates
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

      {/* Hero Section */}
      <div className="admin-hero">
        <div className="admin-hero-content">
          <h1>Welcome back, {user?.name || 'Michael Johnson'}!</h1>
          <p>Overseeing Municipal Services operations and managing community improvements across the city.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="admin-stat-card" style={{ backgroundColor: stat.color }}>
              <div className="admin-stat-content">
                <div className="admin-stat-info">
                  <div className="admin-stat-label">{stat.label}</div>
                  <div className="admin-stat-value">{stat.value}</div>
                </div>
                <div className="admin-stat-icon" style={{ backgroundColor: stat.bgColor }}>
                  <Icon size={32} color={stat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Overview */}
      <div className="admin-system-overview">
        <div className="admin-section-header">
          <Settings size={24} color="#5b6fa8" />
          <h2>System Overview</h2>
        </div>
        <p className="admin-section-description">
          Monitor and manage the entire CivicEye platform. Track community engagement, oversee issue resolution, 
          and ensure efficient operations across all departments.
        </p>
        
        <div className="admin-metrics-grid">
          {systemMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="admin-metric-card">
                <div className="admin-metric-icon">
                  <Icon size={24} color={metric.iconColor} />
                </div>
                <div className="admin-metric-content">
                  <div className="admin-metric-label">{metric.label}</div>
                  <div className="admin-metric-value">{metric.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Admin Profile Image */}
        <div className="admin-profile-section">
          <img 
            src="/images/admin-profile.jpg" 
            alt="Admin Profile" 
            className="admin-profile-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Administrative Tools */}
      <div className="admin-tools-section">
        <h2 className="admin-tools-title">Administrative Tools</h2>
        <div className="admin-tools-grid">
          {adminTools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <div 
                key={idx} 
                className="admin-tool-card"
                onClick={() => navigate(tool.route)}
              >
                <div className="admin-tool-icon" style={{ backgroundColor: tool.bgColor }}>
                  <Icon size={28} color={tool.iconColor} />
                </div>
                <div className="admin-tool-content">
                  <h3 className="admin-tool-title">{tool.title}</h3>
                  <p className="admin-tool-description">{tool.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;