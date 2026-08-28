import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApplicationModal } from './ApplicationModal';

export const JobCard = ({ job, onApply }) => {
  const [showModal, setShowModal] = useState(false);
  if (!job) return null;

  const companyName = job.company?.name || job.company_name || 'Top Employer';
  const formattedSalary = job.salary_min || job.salary_max
    ? `$${job.salary_min?.toLocaleString() || 0} - $${job.salary_max?.toLocaleString() || 0}`
    : job.salary_range;

  const empType = job.employment_type ? job.employment_type.replace('_', ' ').toUpperCase() : (job.job_type || 'FULL-TIME');

  const handleApplyClick = () => {
    if (onApply) {
      onApply(job);
    } else {
      setShowModal(true);
    }
  };

  return (
    <div className="job-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <h3 className="job-title" style={{ fontSize: '1.25rem', color: '#FFFFFF', margin: 0, fontWeight: 700 }}>
            {job.title || 'Untitled Position'}
          </h3>
          <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{empType}</span>
        </div>

        <p className="job-company" style={{ marginBottom: '0.85rem' }}>
          {job.company_id ? (
            <Link to={`/companies/${job.company_id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
              {companyName}
            </Link>
          ) : (
            <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem' }}>{companyName}</span>
          )}
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
          <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>📍 {job.location || 'Remote'}</span>
          {formattedSalary && <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>💰 {formattedSalary}</span>}
        </div>
        
        {job.skills && job.skills.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {job.skills.map((skill) => (
              <span key={skill.skill_id || skill.name} style={{ background: 'var(--surface-elevated)', color: 'var(--primary)', border: '1px solid var(--border-light)', fontSize: '0.725rem', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 500 }}>
                {skill.name}
              </span>
            ))}
          </div>
        )}

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
          {job.description || 'Join a high-growth team building cutting-edge solutions.'}
        </p>
      </div>

      <div className="card-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
        <Link to={`/jobs/${job.job_id || job.id}`} className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>Details</Link>
        <button onClick={handleApplyClick} className="btn btn-emerald" style={{ flex: 1, textAlign: 'center' }}>
          Apply &rarr;
        </button>
      </div>

      {showModal && (
        <ApplicationModal job={job} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default JobCard;
