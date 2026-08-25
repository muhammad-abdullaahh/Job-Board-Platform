import React, { useState, useEffect } from 'react';
import { fetchJobsApi } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';

export const JobListingsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobsApi({ q: search })
      .then((data) => {
        setJobs(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search]);

  return (
    <div className="page-container job-listings-page">
      <h1>Job Listings</h1>

      <div className="filter-section">
        <input
          type="text"
          placeholder="Search by title, keyword, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading job listings...</p>
      ) : jobs.length === 0 ? (
        <p>No matching jobs found.</p>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <JobCard key={job.job_id || job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobListingsPage;
