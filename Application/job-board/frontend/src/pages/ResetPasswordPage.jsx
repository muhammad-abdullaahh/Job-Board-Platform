import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { resetPasswordApi } from '../api/authApi';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await resetPasswordApi(token, newPassword);
      setLoading(false);
      setMessage(data.message || 'Password reset successful! You can now log in.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Invalid or expired password reset token.');
    }
  };

  return (
    <div className="auth-page-container container section-padding">
      <div className="auth-card card">
        <Link to="/login" className="btn-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        <div className="auth-header text-center">
          <div className="icon-wrapper">
            <Lock size={28} />
          </div>
          <h2>Set New Password</h2>
          <p className="subtitle">Choose a secure new password for your account</p>
        </div>

        {message && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} />
            <span>{message} Redirecting to login...</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit}>
            {!searchParams.get('token') && (
              <div className="form-group">
                <label>Reset Token</label>
                <input
                  type="text"
                  placeholder="Paste your reset token..."
                  className="form-control"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>New Password</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
