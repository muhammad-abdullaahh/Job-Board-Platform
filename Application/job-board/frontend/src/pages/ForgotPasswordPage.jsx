import React, { useState } from 'react';
import { forgotPasswordApi } from '../api/authApi';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPasswordApi(email);
      setMessage('Password reset instructions have been sent.');
    } catch (err) {
      setMessage('Failed to process request.');
    }
  };

  return (
    <div className="page-container auth-page">
      <h2>Forgot Password</h2>
      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Send Reset Link</button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
