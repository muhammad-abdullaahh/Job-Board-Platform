import React, { useState, useEffect } from 'react';
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
      <section className="hero">
        <h1>Find Your Next Career Opportunity</h1>
        <p>Explore top job listings and connect with employers.</p>
      </section>

      <section className="featured-jobs">
        <h2>Featured Jobs</h2>
        {loading ? (
          <p>Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p>No job listings found.</p>
        ) : (
          <div className="jobs-list">
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
