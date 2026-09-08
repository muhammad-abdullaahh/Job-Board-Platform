import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchJobsWithCache, fetchJobsApi } from '../api/jobsApi';
import { fetchCompaniesWithCache } from '../api/companiesApi';
import { useAuth } from '../auth/useAuth';
import { JobCard } from '../components/JobCard';
import { SkeletonJobGrid } from '../components/SkeletonJobCard';
import { TestimonialsSection } from '../components/TestimonialsSection';

export const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadJobs = async () => {
    // Only set loading to true if we don't already have jobs in state
    if (jobs.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      await fetchJobsWithCache({}, {
        onData: (data) => {
          setJobs(data || []);
          setLoading(false);
        },
        onError: (err) => {
          console.error('Failed to load featured jobs:', err);
          setError('Unable to load jobs at this time. The server or database may be connecting.');
          setLoading(false);
        }
      });
    } catch (err) {
      // Handled in onError callback
    }
  };

  useEffect(() => {
    loadJobs();

    // Idle prefetching for next likely pages (Jobs & Companies)
    const timer = setTimeout(() => {
      fetchCompaniesWithCache().catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const visibleJobs = !isAuthenticated ? jobs.slice(0, 3) : jobs.slice(0, 6);
  const lockedCount = Math.max(0, jobs.length - 3);

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
          <Link
            to="/jobs"
            className="btn btn-emerald"
            onMouseEnter={() => fetchJobsWithCache().catch(() => {})}
          >
            🚀 Explore Open Roles &rarr;
          </Link>
          <Link
            to="/companies"
            className="btn btn-outline"
            onMouseEnter={() => fetchCompaniesWithCache().catch(() => {})}
          >
            🏢 View Employers
          </Link>
        </div>
      </section>

      {/* Quick Metrics Bar */}
      <section className="metrics-grid">
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', padding: 'clamp(1rem, 3vw, 1.5rem)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ color: 'var(--primary)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
            {loading && jobs.length === 0 ? (
              <span className="skeleton-box" style={{ width: '60px', height: '32px', margin: '0 auto', borderRadius: '6px' }} />
            ) : (
              `${jobs.length}+`
            )}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>Active Job Positions</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', padding: 'clamp(1rem, 3vw, 1.5rem)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ color: 'var(--accent-cyan)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>100%</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>Verified Employers</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', padding: 'clamp(1rem, 3vw, 1.5rem)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ color: '#EAB308', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>48 Hours</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>Guaranteed Offer Window</div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="featured-jobs">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.45rem, 3.5vw, 1.85rem)' }}>Featured Opportunities</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {!isAuthenticated 
                ? `Guest Preview: Showing top 3 of ${jobs.length} verified job listings.`
                : 'Verified job listings from top hiring organizations.'}
            </p>
          </div>
          <Link to="/jobs" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            View All Jobs &rarr;
          </Link>
        </div>

        {loading && jobs.length === 0 ? (
          <SkeletonJobGrid count={6} />
        ) : error && jobs.length === 0 ? (
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
          <>
            <div className="jobs-grid">
              {visibleJobs.map((job) => (
                <JobCard key={job.job_id || job.id} job={job} />
              ))}
            </div>

            {!isAuthenticated && lockedCount > 0 && (
              <div className="home-unlock-banner">
                <div className="unlock-banner-content">
                  <div className="unlock-banner-icon">🔒</div>
                  <div>
                    <h4>Unlock +{lockedCount} More Verified Job Openings</h4>
                    <p>Create your free candidate account to browse all listings, view salary details, and apply with one click.</p>
                  </div>
                </div>
                <div className="unlock-banner-actions">
                  <Link to="/register" className="btn btn-emerald">
                    Register Free &rarr;
                  </Link>
                  <Link to="/login" className="btn btn-outline">
                    Log In
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Customer & Employer Testimonials Section */}
      <TestimonialsSection />
    </div>
  );
};

export default HomePage;
