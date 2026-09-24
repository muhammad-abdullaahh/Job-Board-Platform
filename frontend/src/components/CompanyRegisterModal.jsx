import React, { useState, useEffect, useRef } from 'react';
import { createCompanyApi } from '../api/companiesApi';
import { getErrorMessage } from '../errors/errorMessages';

export const CompanyRegisterModal = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [employeeCount, setEmployeeCount] = useState('11-50');
  const [hrContactEmail, setHrContactEmail] = useState('');
  const [croLinkedin, setCroLinkedin] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
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

  const formatUrl = (urlStr) => {
    if (!urlStr || !urlStr.trim()) return null;
    const trimmed = urlStr.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createCompanyApi({
        name: name.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        website: formatUrl(website),
        employee_count: employeeCount || null,
        hr_contact_email: hrContactEmail.trim() || null,
        cro_linkedin: formatUrl(croLinkedin),
        registration_number: registrationNumber.trim() || null,
      });
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Company registration error:', err);
      setError(getErrorMessage(err, 'Failed to register organization profile. Please verify your details.'));
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} ref={backdropRef}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }} ref={contentRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.45rem)', margin: 0, color: 'var(--primary)' }}>Register Organization Profile</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', fontSize: '0.875rem' }}>
              Provide company identity and verification details.
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

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="modal-grid-2col" style={{ marginBottom: '0.85rem' }}>
            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Company Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Technologies"
                style={{ padding: '0.55rem 0.85rem' }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Headquarters / Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA or Remote"
                style={{ padding: '0.55rem 0.85rem' }}
              />
            </div>
          </div>

          <div className="modal-grid-2col" style={{ marginBottom: '0.85rem' }}>
            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Official Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                style={{ padding: '0.55rem 0.85rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Company Size (Employees)</label>
              <select
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                style={{ padding: '0.55rem 0.85rem' }}
              >
                <option value="1-10">1-10 Employees</option>
                <option value="11-50">11-50 Employees</option>
                <option value="51-200">51-200 Employees</option>
                <option value="201-500">201-500 Employees</option>
                <option value="500+">500+ Employees</option>
              </select>
            </div>
          </div>

          <div className="modal-grid-2col" style={{ marginBottom: '0.85rem' }}>
            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>HR / Contact Email *</label>
              <input
                type="email"
                value={hrContactEmail}
                onChange={(e) => setHrContactEmail(e.target.value)}
                placeholder="hr@company.com"
                style={{ padding: '0.55rem 0.85rem' }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>CEO / CRO / Founder LinkedIn</label>
              <input
                type="text"
                value={croLinkedin}
                onChange={(e) => setCroLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/executive"
                style={{ padding: '0.55rem 0.85rem' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Business Tax / Registration ID</label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="e.g. TAX-REG-987654"
              style={{ padding: '0.55rem 0.85rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Company Overview & Mission</label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of company products and culture..."
              style={{ padding: '0.55rem 0.85rem' }}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-emerald">
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyRegisterModal;
