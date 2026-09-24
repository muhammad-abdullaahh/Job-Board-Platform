import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, ShieldCheck, FileText, Lock } from 'lucide-react';

export const TermsModal = ({ isOpen, initialTab = 'terms', onClose, onAccept }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const backdropRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (backdropRef.current) backdropRef.current.scrollTop = 0;
    if (bodyRef.current) bodyRef.current.scrollTop = 0;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const modalNode = (
    <div className="modal-backdrop" onClick={onClose} ref={backdropRef}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--surface-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldCheck size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#FFFFFF' }}>Platform Agreements & Legal Terms</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                JobBoard Candidate & Employer Code of Conduct
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px',
              transition: 'color 0.2s',
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--surface-card)',
            padding: '0 1rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            style={{
              flex: 1,
              padding: '0.85rem 0.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'terms' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'terms' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <FileText size={16} /> Terms of Service
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            style={{
              flex: 1,
              padding: '0.85rem 0.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'privacy' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'privacy' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <Lock size={16} /> Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('candidate')}
            style={{
              flex: 1,
              padding: '0.85rem 0.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'candidate' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'candidate' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <ShieldCheck size={16} /> Candidate Data Agreement
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div
          ref={bodyRef}
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
            fontSize: '0.9rem',
            lineHeight: 1.65,
            color: 'var(--text-secondary)',
          }}
        >
          {activeTab === 'terms' && (
            <div>
              <h4 style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontSize: '1.05rem' }}>1. Acceptance of Terms</h4>
              <p style={{ marginBottom: '1rem' }}>
                By creating an account on JobBoard, you confirm that you are at least 18 years old and agree to adhere to these Terms of Service, community rules, and all applicable employment legislation.
              </p>

              <h4 style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontSize: '1.05rem' }}>2. Authenticity & Representations</h4>
              <p style={{ marginBottom: '1rem' }}>
                You warrant that all profile information, professional background, past work experience, and uploaded resume files accurately represent your actual credentials. Submitting fraudulent credentials or impersonating third parties will result in permanent account termination.
              </p>

              <h4 style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontSize: '1.05rem' }}>3. Prohibited Activities</h4>
              <p style={{ marginBottom: '1rem' }}>
                Users are strictly prohibited from utilizing automated scrapers or bots without authorization, transmitting malicious code, attempting unauthorized access to employer dashboards, or engaging in discriminatory hiring practices.
              </p>

              <h4 style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontSize: '1.05rem' }}>4. Platform Role & Disclaimers</h4>
              <p style={{ marginBottom: '1rem' }}>
                JobBoard serves as a connection platform between candidates and hiring organizations. While we verify employer profiles, final hiring decisions, employment contracts, and workplace negotiations are conducted directly between candidates and employers.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <h4 style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontSize: '1.05rem' }}>1. Information We Collect</h4>
              <p style={{ marginBottom: '1rem' }}>
                We collect information you explicitly provide during account registration and profile setup, including your full name, email address, password hashes, professional bio, years of experience, and job applications submitted.
              </p>

              <h4 style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontSize: '1.05rem' }}>2. How We Secure Your Data</h4>
              <p style={{ marginBottom: '1rem' }}>
                All user passwords are encrypted using secure cryptographic hashing algorithms. Sensitive session tokens are transmitted using modern TLS encryption and protected via strict HTTP-only authentication cookies.
              </p>

              <h4 style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontSize: '1.05rem' }}>3. Data Sharing with Employers</h4>
              <p style={{ marginBottom: '1rem' }}>
                Your candidate profile and application documents are only shared with authorized recruiters and administrators representing the specific company listings you choose to apply to. We never sell your personal data to third-party ad networks.
              </p>

              <h4 style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontSize: '1.05rem' }}>4. User Data Control</h4>
              <p style={{ marginBottom: '1rem' }}>
                You hold the right to update your profile details, edit application submissions, or request complete account deletion at any time by contacting our privacy compliance team or via your user dashboard.
              </p>
            </div>
          )}

          {activeTab === 'candidate' && (
            <div>
              <h4 style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontSize: '1.05rem' }}>1. Recruitment Processing Consent</h4>
              <p style={{ marginBottom: '1rem' }}>
                You authorize JobBoard and verified hiring managers to analyze your application credentials, portfolio links, and resume content solely for the evaluation of candidate suitability for open job postings.
              </p>

              <h4 style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontSize: '1.05rem' }}>2. Real-Time Application Tracking</h4>
              <p style={{ marginBottom: '1rem' }}>
                You consent to receiving status updates (e.g. Under Review, Shortlisted, Interview Scheduled, Offer Issued) directly through your registered email address and interactive dashboard notifications.
              </p>

              <h4 style={{ color: '#FFFFFF', marginBottom: '0.75rem', fontSize: '1.05rem' }}>3. Equal Opportunity Standard</h4>
              <p style={{ marginBottom: '1rem' }}>
                All candidate data is processed in compliance with equal employment opportunity guidelines, free from discrimination based on race, gender, religion, age, or disability.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-light)',
            background: 'var(--surface-elevated)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Updated September 2026 &bull; Version 2.4
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              style={{ padding: '0.5rem 1.15rem', fontSize: '0.85rem' }}
            >
              Close
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.35rem', fontSize: '0.85rem' }}
              >
                I Accept & Agree &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalNode, document.body);
};

export default TermsModal;
