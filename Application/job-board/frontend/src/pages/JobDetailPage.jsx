import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchJobDetailApi } from '../api/jobsApi';
import { ApplicationModal } from '../components/ApplicationModal';

export const JobDetailPage = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchJobDetailApi(jobId)
      .then((data) => {
        setJob(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [jobId]);

  if (loading) return <div className="page-container"><p>Loading job details...</p></div>;
  if (!job) return <div className="page-container"><p>Job not found.</p></div>;

  return (
    <div className="page-container job-detail-page">
      <h1>{job.title}</h1>
      <p className="company-name">{job.company_name}</p>
      <p className="location">{job.location}</p>
      <p className="salary">{job.salary_range}</p>

      <div className="job-description">
        <h3>Description</h3>
        <p>{job.description}</p>
      </div>

      <button onClick={() => setShowModal(true)} className="btn btn-primary">Apply Now</button>

      {showModal && (
        <ApplicationModal job={job} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default JobDetailPage;
