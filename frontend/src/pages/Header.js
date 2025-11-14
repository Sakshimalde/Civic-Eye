import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext'; // Uncomment if you have this context
import { ArrowRight } from 'lucide-react';
import '../pages/Header.css'; // Link to its own CSS

const Header = () => {
    // const { user, signOut } = useAuth(); // Uncomment if using AuthContext
    const user = { name: 'John Doe' }; // MOCK USER for design purposes - remove if using AuthContext
    const navigate = useNavigate();

    const handleLogout = () => {
        // Your actual logout logic here
        // signOut(); // Uncomment if using AuthContext
        navigate('/Home'); // Redirect to login after logout
    };

    const getUserInitials = (name) => {
        if (!name) return 'JD'; // Default if no user or name
        return name.split(' ').map(part => part[0]).join('').toUpperCase();
    };

    return (
        <header className="app-header">
            
            <nav className="nav-links">
                <Link to="/">Home</Link>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/browse-issues">Browse Issues</Link>
                <Link to="/report-issue" className="active">Report Issue</Link>
            </nav>
            {user && ( // Only show if user is logged in
                <div className="user-profile">
                    <Link to="/profile" className="profile-link">
                        <div className="user-initials">{getUserInitials(user.name)}</div>
                        <span className="user-name">{user.name}</span>
                    </Link>
                    <button onClick={handleLogout} className="logout-btn-header">
                        <ArrowRight size={20} />
                    </button>
                </div>
            )}
        </header>
    );
};

export default Header;