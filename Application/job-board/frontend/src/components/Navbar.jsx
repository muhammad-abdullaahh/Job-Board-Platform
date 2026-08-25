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
          <span>JobBoard</span>
        </Link>

        <nav className="nav-links">
          <Link to="/jobs" className="nav-link">Jobs</Link>

          {isAuthenticated ? (
            <div className="nav-user">
              <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
              <span className="user-email">{user?.name || user?.email}</span>
              <button onClick={handleLogout} className="btn btn-logout">Logout</button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
