import React, { useState } from 'react';
import { resetPasswordApi } from '../api/authApi';

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPasswordApi({ new_password: password });
      setMessage('Password updated successfully.');
    } catch (err) {
      setMessage('Failed to reset password.');
    }
  };

  return (
    <div className="page-container auth-page">
      <h2>Reset Password</h2>
      {message && <p>{message}</p>}

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
