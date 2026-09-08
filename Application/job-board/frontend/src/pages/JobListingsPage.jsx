import React, { useState, useEffect } from 'react';
import { fetchJobsWithCache, fetchJobsApi } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';
import { SkeletonJobGrid } from '../components/SkeletonJobCard';

export const JobListingsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedLocation, setDebouncedLocation] = useState('');
  const [debouncedSalary, setDebouncedSalary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search, location, and salary inputs by 300ms to avoid flooding Supabase with requests
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSalary(minSalary);
    }, 300);
    return () => clearTimeout(timer);
  }, [minSalary]);

  const loadJobs = async () => {
    // Keep showing existing jobs if available, otherwise show skeleton
    if (jobs.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      let sortBy = 'created_at';
      let sortOrder = 'desc';
      if (sortOption === 'oldest') {
        sortBy = 'created_at';
        sortOrder = 'asc';
      } else if (sortOption === 'salary_desc') {
        sortBy = 'salary';
        sortOrder = 'desc';
      } else if (sortOption === 'salary_asc') {
        sortBy = 'salary';
        sortOrder = 'asc';
      }

      const params = {
        q: debouncedSearch.trim() || undefined,
        location: debouncedLocation.trim() || undefined,
        employment_type: employmentType || undefined,
        min_salary: debouncedSalary ? Number(debouncedSalary) : undefined,
        sort_by: sortBy,
        order: sortOrder,
      };

      await fetchJobsWithCache(params, {
        onData: (data) => {
          setJobs(data || []);
          setLoading(false);
        },
        onError: (err) => {
          console.error('Failed to load jobs:', err);
          setError('Unable to load job listings right now. The database may be warming up or temporarily unreachable.');
          setLoading(false);
        }
      });
    } catch (err) {
      // Handled in onError callback
    }
  };

  useEffect(() => {
    loadJobs();
  }, [debouncedSearch, debouncedLocation, employmentType, debouncedSalary, sortOption]);

  return (
    <div className="page-container job-listings-page">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.35rem' }}>Explore Opportunities</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Find your next role among active positions from verified companies.</p>
      </div>

      <div className="filter-section" style={{ marginBottom: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
          style={{ flex: '1 1 140px' }}
        />
        <select
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
          style={{ flex: '1 1 140px' }}
        >
          <option value="">All Employment Types</option>
          <option value="full_time">Full Time</option>
          <option value="part_time">Part Time</option>
          <option value="contract">Contract</option>
          <option value="remote">Remote</option>
          <option value="internship">Internship</option>
        </select>
        <input
          type="number"
          placeholder="💰 Min Salary ($)..."
          value={minSalary}
          onChange={(e) => setMinSalary(e.target.value)}
          style={{ flex: '1 1 130px' }}
          min="0"
          step="5000"
        />
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          style={{ flex: '1 1 140px' }}
        >
          <option value="newest">📅 Newest First</option>
          <option value="oldest">📅 Oldest First</option>
          <option value="salary_desc">💰 Highest Salary</option>
          <option value="salary_asc">💰 Lowest Salary</option>
        </select>
      </div>

      {loading && jobs.length === 0 ? (
        <SkeletonJobGrid count={6} />
      ) : error && jobs.length === 0 ? (
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
