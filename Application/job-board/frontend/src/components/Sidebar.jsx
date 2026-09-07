import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export const Sidebar = ({ isCollapsed = false, toggleCollapse }) => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // On mobile drawer, always show full navigation regardless of desktop collapse state
  const showFullNav = !isCollapsed || isOpen;

  // Prevent background scrolling when mobile drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
        <Link to="/" className="sidebar-logo" onClick={closeDrawer} title="Job-Board">
          <img src="/logo-icon.png" alt="Job-Board Logo" className="logo-icon-img" />
          <span className="logo-text">Job-<span>Board</span></span>
        </Link>
        <button
          className="mobile-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Backdrop for Mobile Drawer */}
      {isOpen && <div className="sidebar-backdrop" onClick={closeDrawer} />}

      {/* Persistent Left Sidebar / Mobile Off-canvas Drawer */}
      <aside className={`sidebar ${isCollapsed && !isOpen ? 'collapsed' : ''} ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo" onClick={closeDrawer} title="Job-Board">
            <img src="/logo-icon.png" alt="Job-Board Logo" className="logo-icon-img" />
            {showFullNav && <span className="logo-text">Job-<span>Board</span></span>}
          </Link>

          {/* Mobile Drawer Close Button */}
          <button
            className="mobile-drawer-close-btn"
            onClick={closeDrawer}
            aria-label="Close navigation"
          >
            ✕
          </button>

          {/* Desktop Collapse / Expand Toggle Button */}
          {toggleCollapse && (
            <button
              className="sidebar-collapse-btn"
              onClick={toggleCollapse}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
        </div>

        {/* Primary Navigation Menu */}
        <nav className="sidebar-nav">
          {showFullNav && <div className="nav-section-title">NAVIGATION</div>}
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={closeDrawer}
            title={!showFullNav ? "Home" : undefined}
          >
            <span className="link-icon">🏠</span>
            {showFullNav && <span className="link-label">Home</span>}
          </NavLink>

          <NavLink
            to="/jobs"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={closeDrawer}
            title={!showFullNav ? "Explore Jobs" : undefined}
          >
            <span className="link-icon">💼</span>
            {showFullNav && <span className="link-label">Explore Jobs</span>}
          </NavLink>

          <NavLink
            to="/companies"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={closeDrawer}
            title={!showFullNav ? "Employers" : undefined}
          >
            <span className="link-icon">🏢</span>
            {showFullNav && <span className="link-label">Employers</span>}
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeDrawer}
              title={!showFullNav ? "Dashboard" : undefined}
            >
              <span className="link-icon">⚡</span>
              {showFullNav && <span className="link-label">Dashboard</span>}
            </NavLink>
          )}
        </nav>

        {/* Bottom User / Auth Section */}
        <div className="sidebar-footer">
          {isAuthenticated ? (
            <div className="sidebar-user-card" title={!showFullNav ? `${user?.name || 'User'} (${user?.email})` : undefined}>
              <div className="user-info-row">
                <div className="user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                {showFullNav && (
                  <div className="user-details">
                    <div className="user-name">{user?.name || 'User Profile'}</div>
                    <div className="user-email">{user?.email}</div>
                  </div>
                )}
              </div>

              {showFullNav && (
                <div className="user-role-badge">
                  {user?.role === 'admin' || user?.is_admin ? (
                    <span className="role-tag role-admin">👑 Administrator</span>
                  ) : user?.role === 'employer' ? (
                    <span className="role-tag role-employer">🏢 Employer</span>
                  ) : (
                    <span className="role-tag role-candidate">🎯 Job Seeker</span>
                  )}
                </div>
              )}

              <button
                onClick={handleLogout}
                className="btn-sidebar-logout"
                title="Sign Out"
              >
                <span>🚪</span>
                {showFullNav && <span>Sign Out</span>}
              </button>
            </div>
          ) : (
            <div className="sidebar-auth-card">
              {showFullNav && <p className="auth-prompt">Access candidate & employer features</p>}
              <div className="auth-btn-group">
                <Link to="/login" className="btn btn-outline-sidebar" onClick={closeDrawer} title={!showFullNav ? "Log In" : undefined}>
                  {!showFullNav ? '🔑' : 'Log In'}
                </Link>
                <Link to="/register" className="btn btn-emerald-sidebar" onClick={closeDrawer} title={!showFullNav ? "Register" : undefined}>
                  {!showFullNav ? '✨' : 'Register →'}
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
