import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchJobDetailApi } from '../api/jobsApi';
import { ApplicationModal } from '../components/ApplicationModal';

export const JobDetailPage = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchJobDetailApi(jobId)
      .then((data) => {
        setJob(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [jobId]);

  if (loading) return <div className="page-container"><p style={{ color: 'var(--text-muted)' }}>Loading job details...</p></div>;
  if (!job) return <div className="page-container"><p style={{ color: 'var(--error)' }}>Job details not found.</p></div>;

  const companyName = job.company?.name || job.company_name || 'Top Employer';
  const formattedSalary = (job.salary_min || job.salary_max)
    ? `$${job.salary_min?.toLocaleString() || 0} - $${job.salary_max?.toLocaleString() || 0}`
    : job.salary_range;

  const empType = job.employment_type ? job.employment_type.replace('_', ' ').toUpperCase() : 'FULL-TIME';

  return (
    <div className="page-container job-detail-page">
      <div style={{ background: 'var(--surface-card)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{job.title}</h1>
            <p className="company-name" style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 600 }}>
              {job.company_id ? (
                <Link to={`/companies/${job.company_id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                  🏢 {companyName}
                </Link>
              ) : (
                `🏢 ${companyName}`
              )}
            </p>
          </div>
          <span className="badge badge-primary" style={{ fontSize: '0.9rem', padding: '0.4rem 0.85rem' }}>{empType}</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          <span>📍 {job.location || 'Remote'}</span>
          {formattedSalary && <span>💰 {formattedSalary}</span>}
          <span>📅 Posted {new Date(job.created_at || Date.now()).toLocaleDateString()}</span>
        </div>

        {job.skills && job.skills.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Required Skills:</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {job.skills.map((skill) => (
                <span key={skill.skill_id || skill.name} className="badge badge-accent" style={{ fontSize: '0.8rem' }}>
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="job-description" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Position Description</h3>
          <p style={{ whiteSpace: 'pre-line', lineHeight: '1.7', color: 'var(--text-secondary)' }}>{job.description}</p>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
            Apply Now &rarr;
          </button>
        </div>
      </div>

      {showModal && (
        <ApplicationModal job={job} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default JobDetailPage;
