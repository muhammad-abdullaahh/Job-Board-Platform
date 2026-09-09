import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPasswordApi } from '../api/authApi';
import { getErrorMessage } from '../errors/errorMessages';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    try {
      await resetPasswordApi(token, password);
      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reset password. The link may have expired or is invalid.'));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand-header">
        <Link to="/" title="Job-Board">
          <img src="/Job-Board-Logo.jpg" alt="Job-Board Logo" className="auth-logo-img" />
        </Link>
      </div>
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Reset Password</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
        Choose a secure new password for your account
      </p>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}>
          Update Password &rarr;
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
