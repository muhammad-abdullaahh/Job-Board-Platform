import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, AlertTriangle, ShieldAlert } from 'lucide-react';
import { deleteMyAccountApi } from '../api/usersApi';
import { getErrorMessage } from '../errors/errorMessages';

export const DeleteAccountModal = ({ isOpen, onClose, onAccountDeleted }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const backdropRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    if (backdropRef.current) backdropRef.current.scrollTop = 0;
    if (contentRef.current) contentRef.current.scrollTop = 0;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (error && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [error]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your current password to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteMyAccountApi(password);
      if (onAccountDeleted) {
        onAccountDeleted();
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete account. Please verify your password and try again.'));
      setIsDeleting(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        ref={contentRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface-card)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 25px rgba(239, 68, 68, 0.15)',
          maxWidth: '520px',
          width: '100%',
          padding: 'clamp(1.25rem, 3vw, 2rem)',
          position: 'relative',
        }}
      >
        {/* Header with Danger Accent */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#FFF' }}>
                Delete Account
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 600 }}>
                Permanent & Cascading Action
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Warning Callout Box */}
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            gap: '0.75rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            color: 'var(--text-secondary)',
          }}
        >
          <AlertTriangle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <strong style={{ color: '#FCA5A5', display: 'block', marginBottom: '0.25rem' }}>
              Are you absolutely sure you want to proceed?
            </strong>
            Deleting your account will immediately revoke access and cascade to all your associated records:
            <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, color: 'var(--text-secondary)' }}>
              <li>All candidate applications and cover letters</li>
              <li>Registered company profiles and hiring verification</li>
              <li>Active job postings and candidate applicant reviews</li>
            </ul>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Password Verification Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.45rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-main)',
              }}
            >
              Verify Your Current Password <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password to confirm"
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.75rem 2.75rem 0.75rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border-light)',
                  color: '#FFF',
                  fontSize: '0.95rem',
                }}
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
                  padding: '0.2rem',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              For your protection, we require your password before completing this request.
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="btn btn-outline"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeleting || !password.trim()}
              className="btn"
              style={{
                background: '#DC2626',
                borderColor: '#DC2626',
                color: '#FFF',
                padding: '0.65rem 1.35rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                opacity: isDeleting || !password.trim() ? 0.6 : 1,
                cursor: isDeleting || !password.trim() ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {isDeleting ? 'Deleting Account...' : '🗑️ Confirm & Delete Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default DeleteAccountModal;
