import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export const TopHeader = ({ onMobileMenuToggle }) => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  // Determine current page label or tagline
  const getPageContext = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Job-Board Platform', subtitle: 'Connecting top talent with verified leaders' };
    if (path.startsWith('/jobs')) return { title: 'Opportunities', subtitle: 'Explore active tech positions' };
    if (path.startsWith('/companies')) return { title: 'Employer Directory', subtitle: 'Verified hiring organizations' };
    if (path.startsWith('/dashboard')) return { title: 'Command Center', subtitle: 'Applications & status overview' };
    if (path.startsWith('/login')) return { title: 'Sign In', subtitle: 'Access your account' };
    if (path.startsWith('/register')) return { title: 'Join Job-Board', subtitle: 'Create your free account' };
    return { title: 'Job-Board', subtitle: 'Tech careers & talent matching' };
  };

  const context = getPageContext();

  return (
    <header className="top-header">
      <div className="top-header-left">
        {onMobileMenuToggle && (
          <button
            className="top-header-mobile-toggle"
            onClick={onMobileMenuToggle}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
        )}
        <div className="top-header-title-wrap">
          <span className="top-header-badge">✨ PLATFORM</span>
          <span className="top-header-subtitle">{context.subtitle}</span>
        </div>
      </div>

      <div className="top-header-right">
        {isAuthenticated ? (
          <div className="top-header-user">
            <Link to="/dashboard" className="top-header-profile-link" title="Go to Dashboard">
              <div className="top-header-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="top-header-user-info">
                <span className="top-header-user-name">{user?.name || 'User Profile'}</span>
                <span className="top-header-role-badge">
                  {user?.role === 'employer' ? '🏢 Employer' : user?.role === 'admin' ? '👑 Admin' : '🎯 Candidate'}
                </span>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm top-header-logout-btn"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="top-header-auth-module">
            <Link to="/login" className="btn btn-outline top-header-login-btn">
              Log In
            </Link>
            <Link to="/register" className="btn btn-emerald top-header-register-btn">
              Register Free &rarr;
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopHeader;
