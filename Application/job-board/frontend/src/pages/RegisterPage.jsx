import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { registerApi } from '../api/authApi';
import { useAuth } from '../auth/useAuth';
import { TermsModal } from '../components/TermsModal';
import { getErrorMessage } from '../errors/errorMessages';

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [bio, setBio] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Agreement Checkboxes
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeDataProcessing, setAgreeDataProcessing] = useState(false);
  const [optInAlerts, setOptInAlerts] = useState(true);

  // Terms Modal State
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState('terms');

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const strength = calculatePasswordStrength(password);
  const isPasswordTooWeak = password.length > 0 && strength.score <= 1;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const openModalWithTab = (tab) => {
    setModalInitialTab(tab);
    setShowTermsModal(true);
  };

  const handleAcceptAllTerms = () => {
    setAgreeTerms(true);
    setAgreeDataProcessing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 1. Password strength validation
    if (strength.score <= 1) {
      setError('Password strength is too weak. Please meet at least 3 strength criteria (minimum 8 characters with letters, numbers, and symbols).');
      return;
    }

    // 2. Confirm password match validation
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    // 3. Mandatory Terms & Conditions check
    if (!agreeTerms) {
      setError('You must accept the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    // 4. Mandatory Data Processing Consent check
    if (!agreeDataProcessing) {
      setError('You must consent to candidate recruitment data processing to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await registerApi({
        name,
        email,
        password,
        years_of_experience: Number(yearsExperience) || 0,
        bio: bio.trim() || null,
        is_admin: false,
      });
      loginUser(data);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please check your details and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormIncomplete = isPasswordTooWeak || passwordsMismatch || !agreeTerms || !agreeDataProcessing;

  return (
    <div className="auth-page register-card" style={{ maxWidth: '520px' }}>
      <div className="auth-brand-header">
        <Link to="/" title="Job-Board">
          <img src="/Job-Board-Logo.jpg" alt="Job-Board Logo" className="auth-logo-img" />
        </Link>
      </div>
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Create Your Account</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
        Connect with verified hiring organizations and explore top career opportunities
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name <span style={{ color: '#EF4444' }}>*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="form-group">
          <label>Email Address <span style={{ color: '#EF4444' }}>*</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        {/* Password Field */}
        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
          <label>Password <span style={{ color: '#EF4444' }}>*</span></label>
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
          <div style={{ marginBottom: '1.25rem', background: 'var(--surface-elevated)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Password Strength</span>
              <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
            </div>

            {/* Strength Bar */}
            <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-pill)', overflow: 'hidden', marginBottom: '0.65rem' }}>
              <div style={{ height: '100%', width: `${strength.percent}%`, backgroundColor: strength.color, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            {/* Requirement Checklist */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem 0.6rem', fontSize: 'clamp(0.7rem, 2.4vw, 0.75rem)' }}>
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
                ⚠️ Password strength is weak. Please meet at least 3 requirements to proceed.
              </p>
            )}
          </div>
        )}

        {/* Confirm Password Field */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label style={{ margin: 0 }}>Confirm Password <span style={{ color: '#EF4444' }}>*</span></label>
            {confirmPassword.length > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: passwordsMatch ? 'var(--primary)' : '#EF4444'
              }}>
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 size={13} /> Passwords match
                  </>
                ) : (
                  <>
                    <AlertCircle size={13} /> Passwords do not match
                  </>
                )}
              </span>
            )}
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              style={{
                paddingRight: '2.75rem',
                borderColor: passwordsMismatch ? '#EF4444' : passwordsMatch ? 'var(--primary)' : undefined,
                boxShadow: passwordsMismatch ? '0 0 0 1px rgba(239, 68, 68, 0.4)' : undefined
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              title={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

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

        {/* Terms, Privacy & Compliance Agreements Section */}
        <div style={{
          margin: '1.5rem 0',
          padding: '1.15rem',
          background: 'var(--surface-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.95rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              Legal Agreements & Consents
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>* Required fields</span>
          </div>

          {/* 1. Mandatory Terms & Privacy Policy Checkbox */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              style={{ marginTop: '0.15rem', accentColor: 'var(--primary)', width: '17px', height: '17px', cursor: 'pointer', flexShrink: 0 }}
              required
            />
            <span style={{ color: 'var(--text-secondary)' }}>
              I agree to the{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); openModalWithTab('terms'); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, padding: 0, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
              >
                Terms of Service
              </button>{' '}
              and acknowledge the platform{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); openModalWithTab('privacy'); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, padding: 0, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
              >
                Privacy Policy
              </button>. <span style={{ color: '#EF4444' }}>*</span>
            </span>
          </label>

          {/* 2. Mandatory Candidate Data Agreement */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={agreeDataProcessing}
              onChange={(e) => setAgreeDataProcessing(e.target.checked)}
              style={{ marginTop: '0.15rem', accentColor: 'var(--primary)', width: '17px', height: '17px', cursor: 'pointer', flexShrink: 0 }}
              required
            />
            <span style={{ color: 'var(--text-secondary)' }}>
              I consent to the collection and processing of my credentials, resume, and application history for recruitment matching.{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); openModalWithTab('candidate'); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, padding: 0, textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}
              >
                View Agreement
              </button>. <span style={{ color: '#EF4444' }}>*</span>
            </span>
          </label>

          {/* 3. Optional Job Alerts & Career Communications */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={optInAlerts}
              onChange={(e) => setOptInAlerts(e.target.checked)}
              style={{ marginTop: '0.15rem', accentColor: 'var(--primary)', width: '17px', height: '17px', cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>
              Send me tailored job alerts, interview notifications, and employer recommendations. (Optional)
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isFormIncomplete || isSubmitting}
          className="btn btn-primary"
          style={{
            width: '100%',
            marginTop: '0.5rem',
            padding: '0.85rem',
            opacity: (isFormIncomplete || isSubmitting) ? 0.6 : 1,
            cursor: (isFormIncomplete || isSubmitting) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account →'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
      </p>

      {/* Interactive Terms & Agreements Modal */}
      <TermsModal
        isOpen={showTermsModal}
        initialTab={modalInitialTab}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleAcceptAllTerms}
      />
    </div>
  );
};

export default RegisterPage;
