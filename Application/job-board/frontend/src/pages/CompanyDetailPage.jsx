import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building, MapPin, Globe, ArrowLeft, Briefcase } from 'lucide-react';
import { fetchCompanyDetailApi } from '../api/companiesApi';
import { fetchJobsApi } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';
import { ApplicationModal } from '../components/ApplicationModal';
import { useAuth } from '../auth/useAuth';

export const CompanyDetailPage = () => {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetchCompanyDetailApi(companyId),
      fetchJobsApi({ company_id: companyId }),
    ])
      .then(([companyData, jobsData]) => {
        setCompany(companyData);
        setCompanyJobs(jobsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [companyId]);

  if (loading) return <div className="container section-padding loading-spinner">Loading company profile...</div>;
  if (!company) return <div className="container section-padding">Company profile not found.</div>;

  const handleApplyClick = (job) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setSelectedJob(job);
    }
  };

  return (
    <div className="container section-padding">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Company Profile Header */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Building size={24} style={{ color: 'var(--color-accent)' }} />
              <h1>{company.name}</h1>
              {company.is_verified && <span className="verified-dot">✓ Verified Employer</span>}
            </div>

            <div className="text-meta" style={{ display: 'flex', gap: '1.5rem', marginTop: '0.8rem' }}>
              {company.location && (
                <span>
                  <MapPin size={16} /> {company.location}
                </span>
              )}
              {company.website && (
                <a href={company.website} target="_blank" rel="noreferrer" className="btn-link" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Globe size={16} /> {company.website}
                </a>
              )}
            </div>
          </div>
        </div>

        {company.description && (
          <p style={{ marginTop: '1.5rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
            {company.description}
          </p>
        )}
      </div>

      {/* Company Active Job Openings */}
      <h2>Open Positions ({companyJobs.length})</h2>
      {companyJobs.length === 0 ? (
        <div className="card text-center" style={{ marginTop: '1rem', padding: '3rem' }}>
          <Briefcase size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
          <p>This company currently has no active job postings.</p>
        </div>
      ) : (
        <div className="jobs-grid" style={{ marginTop: '1.5rem' }}>
          {companyJobs.map((job) => (
            <JobCard key={job.job_id} job={job} onApply={handleApplyClick} />
          ))}
        </div>
      )}

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
