import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, DollarSign } from 'lucide-react';
import { fetchJobsApi } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';
import { ApplicationModal } from '../components/ApplicationModal';
import { applyToJobApi } from '../api/applicationsApi';
import { useAuth } from '../auth/useAuth';

export const JobListingsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [employmentType, setEmploymentType] = useState('');
  const [minSalary, setMinSalary] = useState('');

  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');

  const loadJobs = () => {
    setLoading(true);
    const params = {};
    if (query) params.q = query;
    if (location) params.location = location;
    if (employmentType) params.employment_type = employmentType;
    if (minSalary) params.min_salary = minSalary;

    fetchJobsApi(params)
      .then((data) => setJobs(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, [employmentType]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadJobs();
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
    <div className="container page-wrapper">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800' }}>Explore All Jobs</h1>
        <p style={{ color: 'var(--text-muted)' }}>Browse active technical openings across leading organizations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
        {/* Filters Sidebar */}
        <aside style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <Filter size={18} color="var(--primary)" />
            <span>Filter Positions</span>
          </div>

          <form onSubmit={handleFilterSubmit}>
            <div className="form-group">
              <label>Search Keyword</label>

              <div className="search-input-group">
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Title or skill..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Location</label>
              <div className="search-input-group">
                <MapPin size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="City or Remote..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Employment Type</label>
              <select
                className="form-control"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            <div className="form-group">
              <label>Min Salary ($/yr)</label>
              <div className="search-input-group">
                <DollarSign size={16} color="var(--text-muted)" />
                <input
                  type="number"
                  placeholder="e.g. 80000"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Apply Filters
            </button>
          </form>
        </aside>

        {/* Job Listings Grid */}
        <main>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading openings...</div>
          ) : jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Jobs Found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try broadening your search keywords or clearing filters.</p>
            </div>
          ) : (
            <div className="job-grid" style={{ marginTop: 0 }}>
              {jobs.map((job) => (
                <JobCard key={job.job_id} job={job} onApplyClick={handleApplyClick} />
              ))}
            </div>
          )}
        </main>
      </div>

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
