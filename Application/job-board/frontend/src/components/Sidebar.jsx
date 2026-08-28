import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export const Sidebar = () => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    setIsOpen(false);
    navigate('/');
  };

  const closeDrawer = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Top Header Bar */}
      <header className="mobile-header">
        <Link to="/" className="sidebar-logo">
          <div className="logo-icon">CH</div>
          <span className="logo-text">Career<span>Hub</span></span>
        </Link>
        <button
          className="mobile-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Navigation"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Backdrop for Mobile Drawer */}
      {isOpen && <div className="sidebar-backdrop" onClick={closeDrawer} />}

      {/* Persistent Left Sidebar */}
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo" onClick={closeDrawer}>
            <div className="logo-icon">CH</div>
            <span className="logo-text">Career<span>Hub</span></span>
          </Link>
        </div>

        {/* Primary Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">NAVIGATION</div>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={closeDrawer}
          >
            <span className="link-icon">🏠</span>
            <span className="link-label">Home</span>
          </NavLink>

          <NavLink
            to="/jobs"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={closeDrawer}
          >
            <span className="link-icon">💼</span>
            <span className="link-label">Explore Jobs</span>
          </NavLink>

          <NavLink
            to="/companies"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={closeDrawer}
          >
            <span className="link-icon">🏢</span>
            <span className="link-label">Employers</span>
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeDrawer}
            >
              <span className="link-icon">⚡</span>
              <span className="link-label">Dashboard</span>
            </NavLink>
          )}
        </nav>

        {/* Bottom User / Auth Section */}
        <div className="sidebar-footer">
          {isAuthenticated ? (
            <div className="sidebar-user-card">
              <div className="user-info-row">
                <div className="user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-details">
                  <div className="user-name">{user?.name || 'User Profile'}</div>
                  <div className="user-email">{user?.email}</div>
                </div>
              </div>

              <div className="user-role-badge">
                {user?.role === 'admin' ? (
                  <span className="role-tag role-admin">👑 Administrator</span>
                ) : user?.role === 'employer' ? (
                  <span className="role-tag role-employer">🏢 Employer</span>
                ) : (
                  <span className="role-tag role-candidate">🎯 Job Seeker</span>
                )}
              </div>

              <button onClick={handleLogout} className="btn-sidebar-logout">
                🚪 Sign Out
              </button>
            </div>
          ) : (
            <div className="sidebar-auth-card">
              <p className="auth-prompt">Access candidate & employer features</p>
              <div className="auth-btn-group">
                <Link to="/login" className="btn btn-outline-sidebar" onClick={closeDrawer}>
                  Log In
                </Link>
                <Link to="/register" className="btn btn-emerald-sidebar" onClick={closeDrawer}>
                  Register &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
