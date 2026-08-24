import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Briefcase, Building } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const JobCard = ({ job, onApply }) => {
  const formattedSalary =
    job.salary_min || job.salary_max
      ? `$${job.salary_min?.toLocaleString() || 0} - $${job.salary_max?.toLocaleString() || 0}`
      : 'Competitive';

  return (
    <div className="card job-card">
      <div className="job-card-header">
        <div>
          <div className="company-tag">
            <Building size={14} />
            {job.company?.company_id ? (
              <Link to={`/companies/${job.company.company_id}`} className="btn-link" style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                {job.company.name}
              </Link>
            ) : (
              <span>{job.company?.name || 'Company'}</span>
            )}
            {job.company?.is_verified && <span className="verified-dot" title="Verified Company">✓ Verified</span>}
          </div>
          <h3 className="job-title">
            <Link to={`/jobs/${job.job_id}`}>{job.title}</Link>
          </h3>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <p className="job-description-excerpt">
        {job.description?.length > 130
          ? `${job.description.substring(0, 130)}...`
          : job.description}
      </p>

      {/* Skills tags */}
      {job.skills && job.skills.length > 0 && (
        <div className="skills-container" style={{ margin: '12px 0' }}>
          {job.skills.map((skill) => (
            <span key={skill.skill_id} className="skill-pill">
              {skill.name}
            </span>
          ))}
        </div>
      )}

      <div className="job-card-footer">
        <div className="job-meta">
          <span>
            <MapPin size={14} /> {job.location || 'Remote'}
          </span>
          <span>
            <Briefcase size={14} /> {job.employment_type?.replace('_', ' ')}
          </span>
          <span>
            <DollarSign size={14} /> {formattedSalary}
          </span>
        </div>

        <div className="job-actions">
          <Link to={`/jobs/${job.job_id}`} className="btn btn-secondary btn-sm">
            Details
          </Link>
          {onApply && job.status === 'open' && (
            <button onClick={() => onApply(job)} className="btn btn-primary btn-sm">
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
