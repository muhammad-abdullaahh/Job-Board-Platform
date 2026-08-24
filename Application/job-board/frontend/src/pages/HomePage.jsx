import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, ArrowRight, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchJobsApi } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';
import { ApplicationModal } from '../components/ApplicationModal';
import { applyToJobApi } from '../api/applicationsApi';
import { useAuth } from '../auth/useAuth';

export const HomePage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobsApi({ limit: 6 })
      .then((data) => setJobs(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/jobs?q=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(locationTerm)}`);
  };

  const handleApplyClick = (job) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedJob(job);
  };

  const handleApplySubmit = async (jobId, coverLetter) => {
    setApplying(true);
    setApplyError('');
    try {
      await applyToJobApi(jobId, coverLetter, token);
      setSelectedJob(null);
      alert('Application submitted successfully!');
    } catch (err) {
      setApplyError(err.response?.data?.detail || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div>
      <section className="hero-banner">
        <div className="container">
          <h1 className="hero-title">Find Your Dream Tech Job Today</h1>
          <p className="hero-subtitle">
            Connect with top verified engineering teams and companies worldwide. Discover opportunities tailored to your skills.
          </p>

          <form onSubmit={handleSearch} className="search-bar-container">
            <div className="search-input-group">
              <Search size={18} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Job title, keywords, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="search-input-group">
              <MapPin size={18} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="City, country or remote..."
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ minWidth: '130px' }}>
              Search Jobs
            </button>
          </form>
        </div>
      </section>

      {/* Feature Highlights */}
      <section style={{ padding: '3rem 0', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <Zap size={32} color="#6366f1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>Direct Applications</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Apply directly to hiring managers with custom cover letters and instant updates.</p>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <ShieldCheck size={32} color="#06b6d4" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>Verified Companies</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Explore verified employers vetted for authentic opportunities and clear compensation.</p>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <TrendingUp size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>Salary Transparency</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Filter by competitive salary ranges, employment types, and experience levels.</p>
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="container" style={{ marginTop: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Featured Opportunities</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Hand-picked job postings open for applications</p>
          </div>
          <button onClick={() => navigate('/jobs')} className="btn btn-secondary">
            View All Jobs <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading latest opportunities...</div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', marginTop: '1.5rem' }}>
            No active job postings available yet.
          </div>
        ) : (
          <div className="job-grid">
            {jobs.map((job) => (
              <JobCard key={job.job_id} job={job} onApplyClick={handleApplyClick} />
            ))}
          </div>
        )}
      </section>

      {selectedJob && (
        <ApplicationModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSubmit={handleApplySubmit}
          loading={applying}
          error={applyError}
        />
      )}
    </div>
  );
};
