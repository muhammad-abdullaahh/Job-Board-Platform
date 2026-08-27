import React, { useState } from 'react';
import { createCompanyApi } from '../api/companiesApi';

export const CompanyRegisterModal = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createCompanyApi({
        name,
        industry,
        description,
        location,
        website,
      });
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register company.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2 style={{ marginBottom: '0.5rem' }}>Register Your Company</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Submit your company details. Your profile will be reviewed by an Admin for verification.
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
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
            <label style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Software & IT, Healthcare"
              style={{ padding: '0.55rem 0.85rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Location / Headquarters</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA or Remote"
              style={{ padding: '0.55rem 0.85rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Website URL</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://company.com"
              style={{ padding: '0.55rem 0.85rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Company Description</label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of company mission..."
              style={{ padding: '0.55rem 0.85rem' }}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyRegisterModal;
