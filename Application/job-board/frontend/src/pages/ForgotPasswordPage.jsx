import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { forgotPasswordApi } from '../api/authApi';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await forgotPasswordApi(email);
      setLoading(false);
      setMessage(data.message || 'Password reset link has been dispatched to your email.');
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Failed to process request. Please try again.');
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
            <Mail size={28} />
          </div>
          <h2>Reset Password</h2>
          <p className="subtitle">Enter your email address to receive password reset instructions</p>
        </div>

        {message && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} />
            <span>{message}</span>
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
            <div className="form-group">
              <label>Registered Email</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Sending Instructions...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
