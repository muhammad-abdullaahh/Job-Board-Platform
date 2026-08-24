import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, User, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

export const Navbar = () => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-logo">
          <Briefcase className="logo-icon" size={24} />
          <span>JobPulse</span>
        </Link>

        <div className="nav-links">
          <Link to="/jobs" className="nav-link">
            Find Jobs
          </Link>

          {isAuthenticated ? (
            <div className="nav-user-menu">
              <Link to="/dashboard" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                {user?.role === 'admin' ? <Shield size={16} /> : <LayoutDashboard size={16} />}
                <span>Dashboard</span>
              </Link>
              <span className="user-email-tag">
                {user?.name || user?.email} {user?.role === 'admin' && <span className="admin-chip">Admin</span>}
              </span>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
