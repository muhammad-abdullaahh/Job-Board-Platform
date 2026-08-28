import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPasswordApi } from '../api/authApi';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
      setError(err.response?.data?.detail || 'Failed to reset password.');
    }
  };

  return (
    <div className="page-container auth-page">
      <h2>Reset Password</h2>
      {message && <div className="success-banner">{message}</div>}
      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Update Password</button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
