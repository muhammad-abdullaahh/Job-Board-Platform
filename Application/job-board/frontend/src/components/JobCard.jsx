import React from 'react';
import { Link } from 'react-router-dom';

export const JobCard = ({ job, onApply }) => {
  if (!job) return null;

  return (
    <div className="job-card">
      <h3 className="job-title">{job.title || 'Job Title Placeholder'}</h3>
      <p className="company-name">{job.company_name || 'Company Name'}</p>
      <p className="job-location">{job.location || 'Location'}</p>
      <p className="job-salary">{job.salary_range || 'Salary Range'}</p>

      <div className="card-actions">
        <Link to={`/jobs/${job.job_id || job.id}`} className="btn btn-secondary">View Details</Link>
        <button onClick={() => onApply && onApply(job)} className="btn btn-primary">Apply Now</button>
      </div>
    </div>
  );
};

export default JobCard;
