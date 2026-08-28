import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCompaniesApi } from '../api/companiesApi';

export const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompaniesApi()
      .then((data) => {
        setCompanies(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.location && c.location.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-container companies-page">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Top Employer Directory</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Explore verified organizations hiring top talent on JobBoard.</p>
      </div>

      <div className="filter-section" style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="🔍 Search companies by name or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '1rem 1.25rem', fontSize: '1rem', boxShadow: 'var(--shadow-md)' }}
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading employer directory...</p>
      ) : filteredCompanies.length === 0 ? (
        <div style={{ background: 'var(--surface-card)', padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <h3>No matching companies found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Try adjusting your search query.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredCompanies.map((company) => (
            <div key={company.company_id} className="job-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>{company.name}</h3>
                  {company.is_verified ? (
                    <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>✓ Verified</span>
                  ) : (
                    <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>Pending</span>
                  )}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {company.location && <span>📍 Location: {company.location}</span>}
                  {company.website && (
                    <span>🌐 Website: <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{company.website}</a></span>
                  )}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {company.description || 'No description provided.'}
                </p>
              </div>

              <Link to={`/companies/${company.company_id}`} className="btn btn-outline" style={{ textAlign: 'center' }}>
                View Company Profile &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;
