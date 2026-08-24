import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { fetchJobsApi } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';
import { ApplicationModal } from '../components/ApplicationModal';
import { useAuth } from '../auth/useAuth';

export const JobListingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  // Filter States
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [employmentType, setEmploymentType] = useState('');
  const [minSalary, setMinSalary] = useState('');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const loadJobs = () => {
    setLoading(true);
    const params = {};
    if (query) params.title = query;
    if (location) params.location = location;
    if (employmentType) params.employment_type = employmentType;
    if (minSalary) params.salary_min = minSalary;

    fetchJobsApi(params)
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, [searchParams]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    if (query) newParams.q = query;
    if (location) newParams.location = location;
    setSearchParams(newParams);
    loadJobs();
  };

  const handleResetFilters = () => {
    setQuery('');
    setLocation('');
    setEmploymentType('');
    setMinSalary('');
    setSearchParams({});
  };

  const handleApplyClick = (job) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setSelectedJob(job);
    }
  };

  return (
    <div className="container section-padding">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Explore All Jobs</h1>
        <p className="subtitle">Filter through active career opportunities</p>
      </div>

      <div className="job-listings-layout">
        {/* Sidebar Filters */}
        <aside className="filter-sidebar">
          <div className="filter-header">
            <h3>
              <Filter size={18} /> Filters
            </h3>
            <button onClick={handleResetFilters} className="btn-link">
              Reset
            </button>
          </div>

          <form onSubmit={handleFilterSubmit}>
            <div className="form-group">
              <label>Search Keyword</label>
              <div className="input-with-icon">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="e.g. Developer, Designer"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                placeholder="e.g. Remote, San Francisco"
                className="form-control"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
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
                <option value="remote">Remote</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div className="form-group">
              <label>Minimum Salary ($)</label>
              <input
                type="number"
                placeholder="e.g. 80000"
                className="form-control"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Apply Filters
            </button>
          </form>
        </aside>

        {/* Job Cards Grid */}
        <main className="job-listings-content">
          {loading ? (
            <div className="loading-spinner">Searching positions...</div>
          ) : jobs.length === 0 ? (
            <div className="card text-center" style={{ padding: '3rem' }}>
              <p>No jobs found matching your filters.</p>
              <button onClick={handleResetFilters} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
                <RefreshCw size={14} /> Reset Filters
              </button>
            </div>
          ) : (
            <div className="jobs-grid">
              {jobs.map((job) => (
                <JobCard key={job.job_id} job={job} onApply={handleApplyClick} />
              ))}
            </div>
          )}
        </main>
      </div>

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
