import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { applyForJobApi } from '../api/applicationsApi';
import { useAuth } from '../auth/useAuth';
import { getErrorMessage } from '../errors/errorMessages';

export const ApplicationModal = ({ job, onClose, onSuccess }) => {
  const { isAuthenticated } = useAuth();
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const backdropRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (backdropRef.current) backdropRef.current.scrollTop = 0;
    if (contentRef.current) contentRef.current.scrollTop = 0;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (error && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please log in or register a candidate account to apply.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fullCoverLetter = resumeUrl 
        ? `${coverLetter}\n\n[Resume Link]: ${resumeUrl}`.trim()
        : coverLetter;
        
      await applyForJobApi({
        job_id: job.job_id || job.id,
        cover_letter: fullCoverLetter,
      });
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to submit application. Please try again.'));
      setLoading(false);
    }
  };

  const modalNode = (
    <div className="modal-backdrop" onClick={onClose} ref={backdropRef}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }} ref={contentRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 'clamp(1.15rem, 3.5vw, 1.35rem)', color: 'var(--primary)', margin: 0, wordBreak: 'break-word' }}>Apply for {job?.title || 'Position'}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Company: <strong>{job?.company?.name || job?.company_name || 'Employer'}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.4rem',
              cursor: 'pointer',
              minWidth: '40px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              padding: 0
            }}
          >
            ✕
          </button>
        </div>

        {!isAuthenticated ? (
          <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border-emerald)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center', margin: '1rem 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
            <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF', marginBottom: '0.5rem' }}>Candidate Login Required</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              You need an active Candidate account to submit job applications and track your progress.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-outline" onClick={onClose} style={{ flex: 1, minWidth: '120px' }}>
                Log In
              </Link>
              <Link to="/register" className="btn btn-emerald" onClick={onClose} style={{ flex: 1 }}>
                Create Account &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-banner">{error}</div>}

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Cover Letter *</label>
              <textarea
                rows="4"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Explain why you are a great fit for this role..."
                required
                style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Resume / Portfolio Link (Optional)</label>
              <input
                type="text"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://drive.google.com/... or https://github.com/..."
                style={{ padding: '0.75rem 1rem', fontSize: '0.95rem' }}
              />
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-emerald">
                {loading ? 'Submitting Application...' : 'Submit Application &rarr;'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalNode, document.body);
};

export default ApplicationModal;
