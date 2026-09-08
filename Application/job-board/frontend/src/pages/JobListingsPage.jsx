import React, { useState, useEffect } from 'react';
import { fetchJobsApi } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';

export const JobListingsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedLocation, setDebouncedLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search and location inputs by 300ms to avoid flooding Supabase with requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(location);
    }, 300);
    return () => clearTimeout(timer);
  }, [location]);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobsApi({
        q: debouncedSearch.trim() || undefined,
        location: debouncedLocation.trim() || undefined,
        employment_type: employmentType || undefined,
      });
      setJobs(data || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError('Unable to load job listings right now. The database may be warming up or temporarily unreachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [debouncedSearch, debouncedLocation, employmentType]);

  return (
    <div className="page-container job-listings-page">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.35rem' }}>Explore Opportunities</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Find your next role among active positions from verified companies.</p>
      </div>

      <div className="filter-section" style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="🔍 Search title or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '2 1 200px' }}
        />
        <input
          type="text"
          placeholder="📍 Filter location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ flex: '1 1 150px' }}
        />
        <select
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
          style={{ flex: '1 1 150px' }}
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
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Searching live opportunities...</p>
        </div>
      ) : error ? (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          padding: '2.5rem',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '560px',
          margin: '0 auto'
        }}>
          <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Connection Notice</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>{error}</p>
          <button
            onClick={loadJobs}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.5rem', cursor: 'pointer' }}
          >
            🔄 Retry Connection
          </button>
        </div>
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
