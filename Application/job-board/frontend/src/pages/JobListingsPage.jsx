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
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Explore Opportunities</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Find your next role among active positions from verified companies.</p>
      </div>

      <div className="filter-section" style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="🔍 Search positions by title, keyword, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '1rem 1.25rem', fontSize: '1rem', boxShadow: 'var(--shadow-md)' }}
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Searching opportunities...</p>
      ) : jobs.length === 0 ? (
        <div style={{ background: 'var(--surface-card)', padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <h3>No matching positions found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Try refining your search terms or keywords.</p>
        </div>
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
