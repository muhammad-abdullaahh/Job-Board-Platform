import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Briefcase, AlertCircle } from 'lucide-react';
import { registerUserApi } from '../api/authApi';
import { useAuth } from '../auth/useAuth';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await registerUserApi({
        name,
        email,
        password,
        bio,
        years_experience: Number(yearsExperience),
        is_admin: isAdmin,
      });
      loginUser(data);
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Registration failed. Please check inputs.');
    }
  };

  return (
    <div className="auth-page-container container section-padding">
      <div className="auth-card card">
        <div className="auth-header text-center">
          <div className="icon-wrapper">
            <UserPlus size={28} />
          </div>
          <h2>Create Account</h2>
          <p className="subtitle">Join JobPulse as a Candidate or Employer</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Account Role Selector */}
          <div className="role-selector-group" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className={`btn btn-block ${!isAdmin ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIsAdmin(false)}
            >
              Candidate / Job Seeker
            </button>
            <button
              type="button"
              className={`btn btn-block ${isAdmin ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIsAdmin(true)}
            >
              Employer / Admin
            </button>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <div className="input-with-icon">
              <User size={18} />
              <input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {!isAdmin && (
            <>
              <div className="form-group">
                <label>Years of Experience</label>
                <div className="input-with-icon">
                  <Briefcase size={18} />
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 4"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Short Bio</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Full-stack engineer passionate about React, FastAPI, and UI architecture..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div className="auth-footer text-center" style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Already registered?{' '}
            <Link to="/login" className="btn-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
