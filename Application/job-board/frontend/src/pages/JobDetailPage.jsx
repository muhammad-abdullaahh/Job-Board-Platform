import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building, MapPin, DollarSign, Briefcase, Calendar, ArrowLeft, Send } from 'lucide-react';
import { fetchJobDetailApi } from '../api/jobsApi';
import { StatusBadge } from '../components/StatusBadge';
import { ApplicationModal } from '../components/ApplicationModal';
import { useAuth } from '../auth/useAuth';

export const JobDetailPage = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobDetailApi(jobId)
      .then((data) => {
        setJob(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [jobId]);

  if (loading) return <div className="container section-padding loading-spinner">Loading job details...</div>;
  if (!job) return <div className="container section-padding">Job posting not found.</div>;

  const handleApply = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setShowModal(true);
    }
  };

  return (
    <div className="container section-padding">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to jobs
      </button>

      <div className="job-detail-card card">
        <div className="job-detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="company-tag">
              <Building size={16} />
              {job.company?.company_id ? (
                <Link to={`/companies/${job.company.company_id}`} className="btn-link" style={{ fontSize: '15px' }}>
                  {job.company.name}
                </Link>
              ) : (
                <span>{job.company?.name || 'Company Profile'}</span>
              )}
              {job.company?.is_verified && <span className="verified-dot">✓ Verified Employer</span>}
            </div>
            <h1 style={{ margin: '8px 0' }}>{job.title}</h1>
            <div className="job-meta" style={{ gap: '20px', margin: '12px 0' }}>
              <span>
                <MapPin size={16} /> {job.location || 'Remote'}
              </span>
              <span>
                <Briefcase size={16} /> {job.employment_type?.replace('_', ' ')}
              </span>
              <span>
                <DollarSign size={16} /> ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}
              </span>
              <span>
                <Calendar size={16} /> Posted {new Date(job.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <StatusBadge status={job.status} />
            {job.status === 'open' && (
              <div style={{ marginTop: '16px' }}>
                <button onClick={handleApply} className="btn btn-primary btn-lg">
                  Apply Now <Send size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        <hr style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />

        <div className="job-detail-section">
          <h2>Job Description</h2>
          <p style={{ whiteSpace: 'pre-line', lineHeight: '1.7', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            {job.description}
          </p>
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="job-detail-section" style={{ marginTop: '24px' }}>
            <h2>Required Skills</h2>
            <div className="skills-container" style={{ marginTop: '12px' }}>
              {job.skills.map((skill) => (
                <span key={skill.skill_id} className="skill-pill">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <ApplicationModal
          job={job}
          onClose={() => setShowModal(false)}
          onSuccess={() => alert('Application submitted successfully!')}
        />
      )}
    </div>
  );
};
