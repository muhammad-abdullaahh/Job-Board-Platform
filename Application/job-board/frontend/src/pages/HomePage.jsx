import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, TrendingUp, ShieldCheck, Briefcase } from 'lucide-react';
import { fetchJobsApi } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';
import { ApplicationModal } from '../components/ApplicationModal';
import { useAuth } from '../auth/useAuth';

export const HomePage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobsApi({ limit: 6 })
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/jobs?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`);
  };

  const handleApplyClick = (job) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setSelectedJob(job);
    }
  };

  return (
    <div className="homepage-wrapper">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container text-center">
          <span className="badge badge-shortlisted" style={{ marginBottom: '16px' }}>
            #1 Modern Career Platform
          </span>
          <h1 className="hero-title">
            Find Your Dream Career <br />
            <span style={{ color: 'var(--color-accent)' }}>Or Hire World-Class Talent</span>
          </h1>
          <p className="hero-subtitle">
            Explore thousands of verified tech, design, and management opportunities with transparent salary ranges.
          </p>

          {/* Search Box */}
          <form className="hero-search-box" onSubmit={handleSearchSubmit}>
            <div className="search-field">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Job title, skill, or keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="search-divider"></div>
            <div className="search-field">
              <MapPin className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Location or 'Remote'..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-search">
              Search Jobs
            </button>
          </form>
        </div>
      </section>

      {/* Feature Stats */}
      <section className="stats-section">
        <div className="container stats-grid">
          <div className="stat-card">
            <TrendingUp size={28} className="stat-icon" />
            <div>
              <h3>10,000+</h3>
              <p className="subtitle">Active Postings</p>
            </div>
          </div>
          <div className="stat-card">
            <ShieldCheck size={28} className="stat-icon" />
            <div>
              <h3>Verified</h3>
              <p className="subtitle">Employer Listings</p>
            </div>
          </div>
          <div className="stat-card">
            <Briefcase size={28} className="stat-icon" />
            <div>
              <h3>48-Hour</h3>
              <p className="subtitle">Offer Turnaround</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="container section-padding">
        <div className="section-header">
          <div>
            <h2>Latest Open Positions</h2>
            <p className="subtitle">Discover hand-picked jobs ready for application</p>
          </div>
          <button onClick={() => navigate('/jobs')} className="btn btn-secondary">
            View All Jobs
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">Searching positions...</div>
        ) : jobs.length === 0 ? (
          <div className="card text-center" style={{ padding: '48px' }}>
            <p className="subtitle">No job postings available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <JobCard key={job.job_id} job={job} onApply={handleApplyClick} />
            ))}
          </div>
        )}
      </section>

      {/* Application Modal */}
      {selectedJob && (
        <ApplicationModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSuccess={() => alert('Application submitted successfully!')}
        />
      )}
    </div>
  );
};
