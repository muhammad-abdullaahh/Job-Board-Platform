import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchJobsWithCache, fetchJobsApi } from '../api/jobsApi';
import { fetchCompaniesWithCache } from '../api/companiesApi';
import { useAuth } from '../auth/useAuth';
import { JobCard } from '../components/JobCard';
import { SkeletonJobGrid } from '../components/SkeletonJobCard';
import { SkeletonCompanyGrid } from '../components/SkeletonCompanyCard';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { getErrorMessage } from '../errors/errorMessages';

export const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadJobs = async () => {
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
          setError(getErrorMessage(err, 'Unable to load featured jobs at this time. Please check your connection or try again shortly.'));
          setLoading(false);
        }
      });
    } catch (err) {
      // Handled in onError callback
    }
  };

  const loadCompanies = async () => {
    try {
      await fetchCompaniesWithCache({}, {
        onData: (data) => {
          setCompanies(data || []);
          setCompaniesLoading(false);
        },
        onError: () => {
          setCompaniesLoading(false);
        }
      });
    } catch (err) {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    loadCompanies();
  }, []);

  const visibleJobs = !isAuthenticated ? jobs.slice(0, 3) : jobs.slice(0, 6);
  const lockedJobCount = Math.max(0, jobs.length - 3);

  const visibleCompanies = !isAuthenticated ? companies.slice(0, 4) : companies.slice(0, 6);
  const lockedCompanyCount = Math.max(0, companies.length - 4);

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
          {!isAuthenticated ? (
            <>
              <Link
                to="/register"
                className="btn btn-emerald"
                style={{ padding: '0.85rem 1.65rem', fontSize: '0.975rem', fontWeight: 700 }}
              >
                ✨ Register &rarr;
              </Link>
              <Link
                to="/login"
                className="btn btn-outline"
                style={{ padding: '0.85rem 1.45rem', fontSize: '0.975rem' }}
              >
                🔑 Log In
              </Link>
              <Link
                to="/jobs"
                className="btn btn-outline"
                style={{ padding: '0.85rem 1.45rem', fontSize: '0.975rem', background: 'rgba(255, 255, 255, 0.03)' }}
                onMouseEnter={() => fetchJobsWithCache().catch(() => {})}
              >
                💼 Explore Jobs
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
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
          <div style={{ color: 'var(--accent-cyan)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
            {companiesLoading && companies.length === 0 ? '100%' : `${companies.length}+`}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>Verified Employers</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', padding: 'clamp(1rem, 3vw, 1.5rem)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ color: '#EAB308', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>48 Hours</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>Guaranteed Offer Window</div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="featured-jobs" style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.45rem, 3.5vw, 1.85rem)' }}>Featured Opportunities</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {!isAuthenticated 
                ? `Guest Preview: Showing top 3 of ${jobs.length} verified job listings.`
                : 'Verified job listings from top hiring organizations.'}
            </p>
          </div>
          {!isAuthenticated ? (
            <Link to="/register" className="btn btn-emerald" style={{ fontSize: '0.85rem', padding: '0.5rem 1.15rem' }}>
              View More Jobs &rarr;
            </Link>
          ) : (
            <Link to="/jobs" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1.15rem' }}>
              View All Jobs &rarr;
            </Link>
          )}
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

            {/* View More Button for Guests */}
            {!isAuthenticated && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link to="/register" className="btn btn-emerald" style={{ padding: '0.8rem 2.25rem', fontSize: '0.95rem' }}>
                  View More Jobs &rarr;
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {/* Top Companies / Employers Section */}
      <section className="featured-companies" style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.45rem, 3.5vw, 1.85rem)' }}>Top Hiring Companies</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {!isAuthenticated 
                ? `Guest Preview: Showing top 4 verified employers hiring now.`
                : 'Explore leading verified tech companies actively recruiting.'}
            </p>
          </div>
          {!isAuthenticated ? (
            <Link to="/register" className="btn btn-emerald" style={{ fontSize: '0.85rem', padding: '0.5rem 1.15rem' }}>
              View More Companies &rarr;
            </Link>
          ) : (
            <Link to="/companies" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1.15rem' }}>
              View All Employers &rarr;
            </Link>
          )}
        </div>

        {companiesLoading && companies.length === 0 ? (
          <SkeletonCompanyGrid count={4} />
        ) : companies.length === 0 ? (
          <div style={{ background: 'var(--surface-card)', padding: '2.5rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <h3>No companies listed yet</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Check back soon as verified organizations join.</p>
          </div>
        ) : (
          <>
            <div className="companies-grid">
              {visibleCompanies.map((company) => (
                <div key={company.company_id} className="job-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', margin: 0, flex: 1, minWidth: '160px', wordBreak: 'break-word' }}>{company.name}</h3>
                      {company.is_verified ? (
                        <span className="badge badge-primary" style={{ fontSize: '0.75rem', flexShrink: 0 }}>✓ Verified</span>
                      ) : (
                        <span className="badge badge-accent" style={{ fontSize: '0.75rem', flexShrink: 0 }}>Pending</span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {company.location && <span>📍 Location: {company.location}</span>}
                      {company.website && (
                        <span style={{ wordBreak: 'break-all' }}>🌐 Website: <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{company.website}</a></span>
                      )}
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {company.description || 'Verified organization hiring top talent on Job-Board.'}
                    </p>
                  </div>

                  <Link to={!isAuthenticated ? "/register" : `/companies/${company.company_id}`} className="btn btn-outline" style={{ textAlign: 'center', width: '100%', minHeight: '40px' }}>
                    {!isAuthenticated ? 'Register to View Profile →' : 'View Company Profile →'}
                  </Link>
                </div>
              ))}
            </div>

            {/* View More Button for Guests */}
            {!isAuthenticated && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link to="/register" className="btn btn-emerald" style={{ padding: '0.8rem 2.25rem', fontSize: '0.95rem' }}>
                  View More Companies &rarr;
                </Link>
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
