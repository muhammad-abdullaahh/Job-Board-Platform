import React from 'react';
import { Link } from 'react-router-dom';

export const JobCard = ({ job, onApply }) => {
  if (!job) return null;

  return (
    <div className="job-card">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <h3 className="job-title">{job.title || 'Untitled Position'}</h3>
          <span className="badge badge-primary">{job.job_type || 'Full-Time'}</span>
        </div>
        <p className="job-company">{job.company_name || 'Top Employer'}</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>📍 {job.location || 'Remote'}</span>
          {job.salary_range && <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>💰 {job.salary_range}</span>}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {job.description || 'Join a high-growth team building cutting-edge solutions.'}
        </p>
      </div>

      <div className="card-actions">
        <Link to={`/jobs/${job.job_id || job.id}`} className="btn btn-outline" style={{ flex: 1 }}>Details</Link>
        <button onClick={() => onApply && onApply(job)} className="btn btn-primary" style={{ flex: 1 }}>
          Apply &rarr;
        </button>
      </div>
    </div>
  );
};

export default JobCard;
