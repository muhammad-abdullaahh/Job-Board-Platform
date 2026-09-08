import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCompaniesWithCache, fetchCompaniesApi } from '../api/companiesApi';
import { useAuth } from '../auth/useAuth';
import { SkeletonCompanyGrid } from '../components/SkeletonCompanyCard';
import { getErrorMessage } from '../errors/errorMessages';

const GUEST_COMPANY_LIMIT = 4;

export const CompaniesPage = () => {
  const { isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCompanies = async () => {
    if (companies.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      await fetchCompaniesWithCache({}, {
        onData: (data) => {
          setCompanies(data || []);
          setLoading(false);
        },
        onError: (err) => {
          console.error('Failed to load companies:', err);
          setError(getErrorMessage(err, 'Unable to load company directory right now. Please check your connection or try again shortly.'));
          setLoading(false);
        }
      });
    } catch (err) {
      // Handled in onError callback
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.location && c.location.toLowerCase().includes(search.toLowerCase()))
  );

  const visibleCompanies = !isAuthenticated ? filteredCompanies.slice(0, GUEST_COMPANY_LIMIT) : filteredCompanies;
  const lockedCount = Math.max(0, filteredCompanies.length - GUEST_COMPANY_LIMIT);

  return (
    <div className="page-container companies-page">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.35rem' }}>Top Employer Directory</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Explore verified organizations hiring top talent on JobBoard.</p>
      </div>

      {!isAuthenticated && filteredCompanies.length > 0 && (
        <div className="guest-preview-banner">
          <div className="guest-preview-icon">🏢🔒</div>
          <div className="guest-preview-text">
            <strong>Guest Preview Mode:</strong> Showing 4 of {filteredCompanies.length} verified companies. Register for free to access direct contact details, employee reviews, and open positions.
          </div>
          <div className="guest-preview-actions">
            <Link to="/register" className="btn btn-emerald" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              Register &rarr;
            </Link>
            <Link to="/login" className="btn btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              Log In
            </Link>
          </div>
        </div>
      )}

      <div className="filter-section" style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="🔍 Search companies by name or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.85rem 1.15rem', fontSize: '0.95rem', boxShadow: 'var(--shadow-sm)' }}
        />
      </div>

      {loading && companies.length === 0 ? (
        <SkeletonCompanyGrid count={6} />
      ) : error && companies.length === 0 ? (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          padding: '2.5rem',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '560px',
          margin: '0 auto'
        }}>
          <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Connection Notice</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>{error}</p>
          <button
            onClick={loadCompanies}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.5rem', cursor: 'pointer' }}
          >
            🔄 Retry Connection
          </button>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div style={{ background: 'var(--surface-card)', padding: 'clamp(1.5rem, 4vw, 3rem)', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <h3>No matching companies found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="companies-grid">
          {visibleCompanies.map((company) => (
            <div key={company.company_id} className="job-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', margin: 0, flex: 1, minWidth: '160px', wordBreak: 'break-word' }}>{company.name}</h3>
                  {company.is_verified ? (
                    <span className="badge badge-primary" style={{ fontSize: '0.75rem', flexShrink: 0 }}>✓ Verified</span>
                  ) : (
                    <span className="badge badge-accent" style={{ fontSize: '0.75rem', flexShrink: 0 }}>Pending</span>
                  )}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {company.location && <span>📍 Location: {company.location}</span>}
                  {company.website && (
                    <span style={{ wordBreak: 'break-all' }}>🌐 Website: <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{company.website}</a></span>
                  )}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {company.description || 'No description provided.'}
                </p>
              </div>

              <Link to={`/companies/${company.company_id}`} className="btn btn-outline" style={{ textAlign: 'center', width: '100%', minHeight: '40px' }}>
                View Company Profile &rarr;
              </Link>
            </div>
          ))}

          {!isAuthenticated && lockedCount > 0 && (
            <div className="job-card guest-lock-card">
              <div className="guest-lock-badge-row">
                <span className="guest-lock-icon">🏢🔒</span>
                <span className="badge badge-accent">Sign In Required</span>
              </div>
              <h3 className="guest-lock-title">
                +{lockedCount} More {lockedCount === 1 ? 'Employer' : 'Employers'} Hidden
              </h3>
              <p className="guest-lock-desc">
                Register a free account to unlock full corporate profiles, internal tech stacks, recruiter contact info, and active hiring roles.
              </p>
              <div className="guest-lock-perks">
                <div className="guest-perk-item">✓ Complete {filteredCompanies.length}+ verified directory</div>
                <div className="guest-perk-item">✓ Direct hiring team contacts</div>
                <div className="guest-perk-item">✓ Company culture & employee reviews</div>
              </div>
              <div className="guest-lock-actions">
                <Link to="/register" className="btn btn-emerald" style={{ width: '100%', textAlign: 'center', marginBottom: '0.6rem' }}>
                  Register to Unlock &rarr;
                </Link>
                <Link to="/login" className="btn btn-outline" style={{ width: '100%', textAlign: 'center' }}>
                  Log In to Existing Account
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;
