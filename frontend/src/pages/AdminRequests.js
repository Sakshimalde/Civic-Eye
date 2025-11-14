import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, AlertCircle, Users, FileText, 
  Clock, Info, ArrowRight
} from 'lucide-react';
import './AdminRequests.css';

const AdminRequests = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [requests, setRequests] = useState([
    {
      id: 1,
      name: 'Emily Rodriguez',
      email: 'emily.r@citycouncil.gov',
      department: 'Public Works',
      requestedDate: '1/23/2024'
    },
    {
      id: 2,
      name: 'David Kim',
      email: 'david.kim@citycouncil.gov',
      department: 'Environmental Services',
      requestedDate: '1/22/2024'
    }
  ]);

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Role-based navigation
  const getNavLinks = () => {
    return [
      { to: '/admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin-all-issues', label: 'All Issues', icon: AlertCircle },
      { to: '/admin-users-volunteers', label: 'Users & Volunteers', icon: Users },
      { to: '/admin-requests', label: 'Admin Requests', icon: FileText },
      { to: '/admin-issues-updates', label: 'Issue Updates', icon: Clock }
    ];
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      signOut();
      navigate('/');
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const handleApprove = (requestId) => {
    if (window.confirm('Are you sure you want to approve this admin request?')) {
      setRequests(requests.filter(req => req.id !== requestId));
      alert('Admin request approved successfully!');
    }
  };

  const handleReject = (requestId) => {
    if (window.confirm('Are you sure you want to reject this admin request?')) {
      setRequests(requests.filter(req => req.id !== requestId));
      alert('Admin request rejected.');
    }
  };

  const navLinks = getNavLinks();

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-requests-page">
      {/* Standard Header */}
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
      <Link to="/admin-requests" className="admin-nav-link active">
        <FileText size={18} />
        Admin Requests
      </Link>
      {/* <Link to="/admin-issues-updates" className="admin-nav-link">
        <Clock size={18} />
        Issue Updates
      </Link> */}
    </nav>
  </div>

  <div className="user-profile">
    <Link to="/AdminProfile" className="profile-link">
      <div className="user-initials">{getUserInitials(user?.name)}</div>
      <span className="user-name">{user?.name}</span>
    </Link>
    <button onClick={handleLogout} className="logout-btn-header">
      <ArrowRight size={20} />
    </button>
  </div>
</header>


      {/* Main Content */}
      <main className="admin-requests-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Admin Requests</h1>
          <p className="page-subtitle">Review and approve new administrator access requests</p>
        </div>

        {/* Requests Section */}
        <section className="requests-section">
          <div className="section-header">
            <h2 className="section-title">Pending Admin Requests</h2>
            <p className="section-description">
              Review requests from users seeking administrator privileges
            </p>
          </div>

          {/* Request Cards */}
          <div className="requests-list">
            {requests.length === 0 ? (
              <div className="no-requests">
                <Info size={48} color="#94a3b8" />
                <p>No pending admin requests at this time</p>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <div className="request-avatar">
                      {request.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="request-info">
                      <h3 className="request-name">{request.name}</h3>
                      <p className="request-email">{request.email}</p>
                    </div>
                  </div>

                  <div className="request-details">
                    <div className="request-detail-item">
                      <span className="detail-label">Department</span>
                      <span className="detail-value">{request.department}</span>
                    </div>
                    <div className="request-detail-item">
                      <span className="detail-label">Requested Date</span>
                      <span className="detail-value">{request.requestedDate}</span>
                    </div>
                  </div>

                  <div className="request-note">
                    <Info size={16} />
                    <span>
                      <strong>Note:</strong> Approving this request will grant full administrative privileges 
                      including user management, issue oversight, and system configuration.
                    </span>
                  </div>

                  <div className="request-actions">
                    <button 
                      className="btn-approve"
                      onClick={() => handleApprove(request.id)}
                    >
                      Approve
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => handleReject(request.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Guidelines Section */}
        <section className="guidelines-section">
          <div className="guidelines-header">
            <Info size={20} />
            <h3>Admin Access Guidelines</h3>
          </div>
          <ul className="guidelines-list">
            <li>Administrators have full system access and can manage all users and issues</li>
            <li>Only approve requests from verified city officials or trusted personnel</li>
            <li>All admin actions are logged for security and audit purposes</li>
            <li>Consider the department and role before granting access</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default AdminRequests;