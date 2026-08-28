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
      {/* Hero Banner Section */}
      <section className="hero-section">
        <span className="badge badge-primary" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
          ✨ NEXT-GEN CAREER PLATFORM
        </span>
        <h1>Shape Your Future with Top Industry Leaders</h1>
        <p>
          Connect directly with verified hiring teams, land high-paying roles, and track your application status in real-time.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/jobs" className="btn btn-emerald" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
            🚀 Explore Open Roles &rarr;
          </Link>
          <Link to="/companies" className="btn btn-outline" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
            🏢 View Employers
          </Link>
        </div>
      </section>

      {/* Quick Metrics Bar */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '3.5rem' }}>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ color: 'var(--primary)', fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>{jobs.length}+</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Active Job Positions</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ color: 'var(--accent-cyan)', fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>100%</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Verified Employers</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ color: '#EAB308', fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>48 Hours</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Guaranteed Offer Window</div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="featured-jobs">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.85rem' }}>Featured Opportunities</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Verified job listings from top hiring organizations.</p>
          </div>
          <Link to="/jobs" className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
            View All Jobs &rarr;
          </Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Searching live opportunities...</p>
        ) : jobs.length === 0 ? (
          <div style={{ background: 'var(--surface-card)', padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <h3>No job listings posted yet</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Check back soon or register as an employer to post new positions.</p>
          </div>
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
