import React, { useState } from 'react';
import { createCompanyApi } from '../api/companiesApi';

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

  const formatUrl = (urlStr) => {
    if (!urlStr || !urlStr.trim()) return null;
    const trimmed = urlStr.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const getErrorMessage = (err) => {
    const detail = err.response?.data?.detail;
    if (!detail) return 'Failed to register company. Please try again.';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg || d.detail || JSON.stringify(d)).join(', ');
    if (typeof detail === 'object') return detail.msg || detail.detail || JSON.stringify(detail);
    return String(detail);
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
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <h2 style={{ marginBottom: '0.35rem', color: 'var(--primary)' }}>Register Organization Profile</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Provide company identity and verification details. An Administrator will review these audit details before approving your employer posting account.
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
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
