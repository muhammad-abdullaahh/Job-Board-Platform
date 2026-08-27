import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export const Navbar = () => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-logo">
          Job<span>Board</span>
        </Link>

        <nav className="nav-links">
          <Link to="/jobs" className="nav-link">Explore Jobs</Link>

          {isAuthenticated ? (
            <div className="nav-user">
              <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
              <span className="user-email" style={{ fontWeight: 600, color: 'var(--primary)' }}>{user?.name || user?.email}</span>
              <button onClick={handleLogout} className="btn btn-logout">Logout</button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-outline">Log In</Link>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
