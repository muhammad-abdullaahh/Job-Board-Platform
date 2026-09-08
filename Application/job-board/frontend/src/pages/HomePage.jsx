import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchJobsApi } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';

export const HomePage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobsApi();
      setJobs(data || []);
    } catch (err) {
      console.error('Failed to load featured jobs:', err);
      setError('Unable to load jobs at this time. The server or database may be connecting.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <div className="page-container home-page">
      {/* Hero Banner Section */}
      <section className="hero-section">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-pill)', background: 'var(--surface-card)', border: '1px solid var(--border-emerald)' }}>
          <img src="/logo-icon.png" alt="Job-Board Logo" style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.04em' }}>JOB-BOARD PLATFORM</span>
        </div>
        <h1>Shape Your Future with Top Industry Leaders</h1>
        <p>
          Connect directly with verified hiring teams, land high-paying roles, and track your application status in real-time.
        </p>
        <div className="hero-cta-group">
          <Link to="/jobs" className="btn btn-emerald">
            🚀 Explore Open Roles &rarr;
          </Link>
          <Link to="/companies" className="btn btn-outline">
            🏢 View Employers
          </Link>
        </div>
      </section>

      {/* Quick Metrics Bar */}
      <section className="metrics-grid">
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', padding: 'clamp(1rem, 3vw, 1.5rem)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ color: 'var(--primary)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>{jobs.length}+</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Active Job Positions</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', padding: 'clamp(1rem, 3vw, 1.5rem)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ color: 'var(--accent-cyan)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>100%</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Verified Employers</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', padding: 'clamp(1rem, 3vw, 1.5rem)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ color: '#EAB308', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>48 Hours</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Guaranteed Offer Window</div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="featured-jobs">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.45rem, 3.5vw, 1.85rem)' }}>Featured Opportunities</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Verified job listings from top hiring organizations.</p>
          </div>
          <Link to="/jobs" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            View All Jobs &rarr;
          </Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Searching live opportunities...</p>
        ) : error ? (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '520px',
            margin: '0 auto'
          }}>
            <h3 style={{ color: '#ef4444', marginBottom: '0.4rem' }}>Connection Notice</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>
            <button
              onClick={loadJobs}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem', cursor: 'pointer' }}
            >
              🔄 Retry Connection
            </button>
          </div>
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
