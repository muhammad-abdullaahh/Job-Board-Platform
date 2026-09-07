import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCompanyDetailApi } from '../api/companiesApi';
import { fetchJobsApi } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';

export const CompanyDetailPage = () => {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCompanyDetailApi(companyId).catch(() => null),
      fetchJobsApi({ company_id: companyId }).catch(() => [])
    ]).then(([compData, jobsData]) => {
      setCompany(compData);
      setCompanyJobs(jobsData || []);
      setLoading(false);
    });
  }, [companyId]);

  if (loading) return <div className="page-container"><p style={{ color: 'var(--text-muted)' }}>Loading company profile...</p></div>;
  if (!company) return <div className="page-container"><p style={{ color: 'var(--error)' }}>Company profile not found.</p></div>;

  return (
    <div className="page-container company-detail-page">
      <div style={{ background: 'var(--surface-card)', padding: 'clamp(1.25rem, 3.5vw, 2.5rem)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, minWidth: 'min(100%, 240px)' }}>
            <h1 style={{ fontSize: 'clamp(1.6rem, 4.5vw, 2.25rem)', marginBottom: '0.25rem', color: 'var(--primary)', wordBreak: 'break-word' }}>{company.name}</h1>
            {company.location && <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>📍 {company.location}</p>}
          </div>
          <div style={{ flexShrink: 0 }}>
            {company.is_verified ? (
              <span className="badge status-accepted" style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}>
                ✓ Verified Employer
              </span>
            ) : (
              <span className="badge status-applied" style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}>
                ⏳ Pending Verification
              </span>
            )}
          </div>
        </div>

        {company.website && (
          <p style={{ marginBottom: '1.25rem', wordBreak: 'break-all', fontSize: '0.95rem' }}>
            🌐 Website: <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-hover)', fontWeight: 600 }}>{company.website}</a>
          </p>
        )}

        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>About {company.name}</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
            {company.description || 'No description available for this organization.'}
          </p>
        </div>
      </div>

      <section className="company-jobs-section">
        <h2 style={{ marginBottom: '1.5rem' }}>Open Positions ({companyJobs.length})</h2>
        {companyJobs.length === 0 ? (
          <div style={{ background: 'var(--surface-card)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <p style={{ color: 'var(--text-muted)' }}>There are currently no active job postings for this company.</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {companyJobs.map((job) => (
              <JobCard key={job.job_id || job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CompanyDetailPage;
