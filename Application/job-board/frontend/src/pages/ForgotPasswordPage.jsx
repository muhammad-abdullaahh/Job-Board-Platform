import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordApi } from '../api/authApi';
import { getErrorMessage } from '../errors/errorMessages';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetData, setResetData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetData(null);
    setLoading(true);
    try {
      const res = await forgotPasswordApi(email);
      setResetData(res);
      if (res.email_sent) {
        setMessage('Password reset instructions have been sent to your email inbox.');
      } else {
        setMessage(res.message || 'Password reset request processed.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to process password reset request. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand-header">
        <Link to="/" title="Job-Board">
          <img src="/Job-Board-Logo.jpg" alt="Job-Board Logo" className="auth-logo-img" />
        </Link>
      </div>
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Forgot Password</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
        Enter your registered email to receive reset instructions
      </p>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Send Reset Link →'}
        </button>
      </form>

      {/* Direct Reset Link Box when SMTP is not configured or in development */}
      {resetData && !resetData.email_sent && resetData.reset_link && (
        <div style={{
          marginTop: '1.25rem',
          padding: '1.15rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(0, 230, 165, 0.08)',
          border: '1px solid var(--border-emerald)',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>Direct Reset Link Ready</strong>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.85rem 0', lineHeight: 1.5 }}>
            Your secure password reset link has been generated. You can proceed directly:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a
              href={resetData.reset_link}
              className="btn btn-emerald"
              style={{ textDecoration: 'none', padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              🔑 Reset Password Now &rarr;
            </a>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                navigator.clipboard.writeText(resetData.reset_link);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              }}
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation when real email was dispatched via SMTP */}
      {resetData && resetData.email_sent && (
        <div style={{
          marginTop: '1.25rem',
          padding: '1.15rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(0, 230, 165, 0.12)',
          border: '1px solid var(--border-emerald)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>📬</div>
          <strong style={{ color: 'var(--primary)', fontSize: '1rem', display: 'block', marginBottom: '0.35rem' }}>Email Dispatched!</strong>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            We have sent password reset instructions to <strong>{email}</strong>. Please check your inbox and spam folder.
          </p>
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Remember your password? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
