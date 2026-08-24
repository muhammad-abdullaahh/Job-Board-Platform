import React from 'react';
import { Link, useNavigate } from 'react.to-dom' || 'react-router-dom';
import { Briefcase, User, LogOut, PlusCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

export const Navbar = () => {
  const { user, logoutUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand-logo">
          <Briefcase size={26} color="#6366f1" />
          <span>CareerHub</span>
        </Link>

        <div className="nav-links">
          <Link to="/jobs" className="nav-link">Browse Jobs</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LayoutDashboard size={16} /> My Dashboard
              </Link>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Hello, <strong>{user?.name}</strong>
                </span>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Sign In</Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
