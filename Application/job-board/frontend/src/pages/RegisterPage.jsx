import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { registerApi } from '../api/authApi';
import { useAuth } from '../auth/useAuth';

const calculatePasswordStrength = (pass) => {
  const checks = {
    length: pass.length >= 8,
    upper: /[A-Z]/.test(pass),
    lower: /[a-z]/.test(pass),
    number: /[0-9]/.test(pass),
    symbol: /[^A-Za-z0-9]/.test(pass),
  };

  if (!pass) {
    return { score: 0, label: '', color: '#64748B', percent: 0, checks };
  }

  let passedChecks = 0;
  if (checks.length) passedChecks += 1;
  if (checks.upper) passedChecks += 1;
  if (checks.lower) passedChecks += 1;
  if (checks.number) passedChecks += 1;
  if (checks.symbol) passedChecks += 1;

  if (pass.length < 6 || passedChecks <= 1) {
    return { score: 1, label: 'Weak', color: '#EF4444', percent: 25, checks };
  } else if (passedChecks === 2 || !checks.length) {
    return { score: 1, label: 'Weak', color: '#EF4444', percent: 35, checks };
  } else if (passedChecks === 3) {
    return { score: 2, label: 'Fair', color: '#F97316', percent: 60, checks };
  } else if (passedChecks === 4) {
    return { score: 3, label: 'Good', color: '#00D2FF', percent: 80, checks };
  } else {
    return { score: 4, label: 'Strong', color: '#00E6A5', percent: 100, checks };
  }
};

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [bio, setBio] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const strength = calculatePasswordStrength(password);
  const isPasswordTooWeak = password.length > 0 && strength.score <= 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Block submission if password strength is Weak
    if (strength.score <= 1) {
      setError('Password strength is too weak. Please meet at least 3 strength criteria (minimum 8 characters with letters, numbers, and symbols).');
      return;
    }

    try {
      const data = await registerApi({
        name,
        email,
        password,
        years_of_experience: Number(yearsExperience) || 0,
        bio: bio.trim() || null,
        is_admin: false
      });
      loginUser(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    }
  };

  return (
    <div className="auth-page">
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Create an Account</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
        Join thousands of professionals & top companies
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
          <label>Password</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ paddingRight: '2.75rem' }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.85rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.2rem',
                transition: 'color 0.2s',
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Dynamic Password Strength Meter */}
        {password.length > 0 && (
          <div style={{ marginBottom: '1.35rem', background: 'var(--surface-elevated)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Password Strength</span>
              <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
            </div>

            {/* Strength Bar */}
            <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-pill)', overflow: 'hidden', marginBottom: '0.65rem' }}>
              <div style={{ height: '100%', width: `${strength.percent}%`, backgroundColor: strength.color, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            {/* Requirement Checklist */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
              <span style={{ color: strength.checks.length ? 'var(--primary)' : 'var(--text-muted)', fontWeight: strength.checks.length ? 600 : 400 }}>
                {strength.checks.length ? '✓' : '○'} 8+ Chars
              </span>
              <span style={{ color: strength.checks.upper ? 'var(--primary)' : 'var(--text-muted)', fontWeight: strength.checks.upper ? 600 : 400 }}>
                {strength.checks.upper ? '✓' : '○'} Uppercase
              </span>
              <span style={{ color: strength.checks.lower ? 'var(--primary)' : 'var(--text-muted)', fontWeight: strength.checks.lower ? 600 : 400 }}>
                {strength.checks.lower ? '✓' : '○'} Lowercase
              </span>
              <span style={{ color: strength.checks.number ? 'var(--primary)' : 'var(--text-muted)', fontWeight: strength.checks.number ? 600 : 400 }}>
                {strength.checks.number ? '✓' : '○'} Number
              </span>
              <span style={{ color: strength.checks.symbol ? 'var(--primary)' : 'var(--text-muted)', fontWeight: strength.checks.symbol ? 600 : 400 }}>
                {strength.checks.symbol ? '✓' : '○'} Symbol
              </span>
            </div>

            {isPasswordTooWeak && (
              <p style={{ color: '#EF4444', fontSize: '0.775rem', marginTop: '0.5rem', fontWeight: 500 }}>
                ⚠️ Password strength is weak. Please add more character types to proceed.
              </p>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Years of Professional Experience</label>
          <input
            type="number"
            min="0"
            max="60"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label>Professional Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Brief introduction about your background, career focus, or target roles..."
          />
        </div>

        <button
          type="submit"
          disabled={isPasswordTooWeak}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem', opacity: isPasswordTooWeak ? 0.6 : 1, cursor: isPasswordTooWeak ? 'not-allowed' : 'pointer' }}
        >
          Create Account &rarr;
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
