import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchJobsApi } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';

export const HomePage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobsApi()
      .then((data) => {
        setJobs(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="page-container home-page">
      <section className="hero-section">
        <h1>Find Your Dream Career</h1>
        <p>Discover top opportunities, connect with verified employers, and advance your professional journey.</p>
        <Link to="/jobs" className="btn btn-primary" style={{ padding: '0.85rem 1.85rem', fontSize: '1.05rem' }}>
          Browse All Jobs &rarr;
        </Link>
      </section>

      <section className="featured-jobs">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Featured Opportunities</h2>
          <span className="badge badge-accent">Live Jobs</span>
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading featured opportunities...</p>
        ) : jobs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No job listings available right now.</p>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <JobCard key={job.job_id || job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
