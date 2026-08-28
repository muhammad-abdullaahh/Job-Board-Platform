import React, { useState, useEffect } from 'react';
import { fetchJobsApi } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';

export const JobListingsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchJobsApi({
      q: search || undefined,
      location: location || undefined,
      employment_type: employmentType || undefined
    })
      .then((data) => {
        setJobs(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, location, employmentType]);

  return (
    <div className="page-container job-listings-page">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Explore Opportunities</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Find your next role among active positions from verified companies.</p>
      </div>

      <div className="filter-section" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Search title or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 2, minWidth: '220px', padding: '0.85rem 1.1rem', fontSize: '0.95rem' }}
        />
        <input
          type="text"
          placeholder="📍 Filter location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ flex: 1, minWidth: '160px', padding: '0.85rem 1.1rem', fontSize: '0.95rem' }}
        />
        <select
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
          style={{ flex: 1, minWidth: '160px', padding: '0.85rem 1.1rem', fontSize: '0.95rem' }}
        >
          <option value="">All Employment Types</option>
          <option value="full_time">Full Time</option>
          <option value="part_time">Part Time</option>
          <option value="contract">Contract</option>
          <option value="remote">Remote</option>
          <option value="internship">Internship</option>
        </select>
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
