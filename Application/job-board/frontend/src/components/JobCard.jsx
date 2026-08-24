import React from 'react';
import { MapPin, DollarSign, Clock, Building, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const JobCard = ({ job, onApplyClick }) => {
  const formattedSalary = job.salary_min && job.salary_max
    ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k / yr`
    : 'Competitive Salary';

  return (
    <div className="job-card">
      <div>
        <div className="job-card-header">
          <span className="company-badge">
            <Building size={13} />
            {job.company?.name || 'Top Company'}
          </span>
          <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>
            {job.employment_type?.replace('_', ' ')}
          </span>
        </div>

        <h3 className="job-title">{job.title}</h3>

        <div className="job-meta">
          {job.location && (
            <div className="job-meta-item">
              <MapPin size={14} />
              <span>{job.location}</span>
            </div>
          )}
          <div className="job-meta-item">
            <DollarSign size={14} />
            <span>{formattedSalary}</span>
          </div>
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="job-skills-tags">
            {job.skills.map((skill) => (
              <span key={skill.skill_id} className="skill-tag">
                {skill.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
        <Link to={`/jobs/${job.job_id}`} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.88rem' }}>
          Details
        </Link>
        <button onClick={() => onApplyClick(job)} className="btn btn-primary" style={{ flex: 1, fontSize: '0.88rem' }}>
          Apply Now <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
