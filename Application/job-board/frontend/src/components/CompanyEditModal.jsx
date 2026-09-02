import React, { useState, useEffect } from 'react';
import { updateCompanyApi } from '../api/companiesApi';

export const CompanyEditModal = ({ company, onClose, onSuccess }) => {
  const [name, setName] = useState(company?.name || '');
  const [description, setDescription] = useState(company?.description || '');
  const [location, setLocation] = useState(company?.location || '');
  const [website, setWebsite] = useState(company?.website || '');
  const [employeeCount, setEmployeeCount] = useState(company?.employee_count || '11-50');
  const [hrContactEmail, setHrContactEmail] = useState(company?.hr_contact_email || '');
  const [croLinkedin, setCroLinkedin] = useState(company?.cro_linkedin || '');
  const [registrationNumber, setRegistrationNumber] = useState(company?.registration_number || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setDescription(company.description || '');
      setLocation(company.location || '');
      setWebsite(company.website || '');
      setEmployeeCount(company.employee_count || '11-50');
      setHrContactEmail(company.hr_contact_email || '');
      setCroLinkedin(company.cro_linkedin || '');
      setRegistrationNumber(company.registration_number || '');
    }
  }, [company]);

  const formatUrl = (urlStr) => {
    if (!urlStr || !urlStr.trim()) return null;
    const trimmed = urlStr.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const getErrorMessage = (err) => {
    const detail = err.response?.data?.detail;
    if (!detail) return 'Failed to update company. Please try again.';
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
      const companyId = company.company_id || company.id;
      await updateCompanyApi(companyId, {
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
      console.error('Company update error:', err);
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <h2 style={{ marginBottom: '0.35rem', color: 'var(--primary)' }}>Edit Company Profile</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Update corporate details for #{company?.company_id || company?.id} {company?.name}
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
              Company Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '0.65rem', background: 'var(--surface-dark)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: '#FFF' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                Location (City, Country)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '0.65rem', background: 'var(--surface-dark)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: '#FFF' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                Official Website
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '0.65rem', background: 'var(--surface-dark)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: '#FFF' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                Employee Count
              </label>
              <select
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '0.65rem', background: 'var(--surface-dark)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: '#FFF' }}
              >
                <option value="1-10">1-10 Employees</option>
                <option value="11-50">11-50 Employees</option>
                <option value="51-200">51-200 Employees</option>
                <option value="201-500">201-500 Employees</option>
                <option value="501-1000">501-1000 Employees</option>
                <option value="1000+">1000+ Employees</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                Registration / Tax ID
              </label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '0.65rem', background: 'var(--surface-dark)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: '#FFF' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                HR / Contact Email
              </label>
              <input
                type="email"
                value={hrContactEmail}
                onChange={(e) => setHrContactEmail(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '0.65rem', background: 'var(--surface-dark)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: '#FFF' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                CRO / Exec LinkedIn URL
              </label>
              <input
                type="text"
                value={croLinkedin}
                onChange={(e) => setCroLinkedin(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '0.65rem', background: 'var(--surface-dark)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: '#FFF' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
              Company Overview & Description
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '0.65rem', background: 'var(--surface-dark)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: '#FFF' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
