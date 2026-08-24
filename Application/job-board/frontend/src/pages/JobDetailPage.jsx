import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building, MapPin, DollarSign, Calendar, ArrowLeft, Send } from 'lucide-react';
import { fetchJobDetailApi } from '../api/jobsApi';
import { applyToJobApi } from '../api/applicationsApi';
import { ApplicationModal } from '../components/ApplicationModal';
import { useAuth } from '../auth/useAuth';

export const JobDetailPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    fetchJobDetailApi(jobId)
      .then((data) => setJob(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleApplySubmit = async (jId, coverLetter) => {
    setApplying(true);
    setApplyError('');
    try {
      await applyToJobApi(jId, coverLetter, token);
      setShowModal(false);
      alert('Application submitted successfully!');
    } catch (err) {
      setApplyError(err.response?.data?.detail || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="container page-wrapper" style={{ textAlign: 'center', padding: '5rem 0' }}>Loading job details...</div>;
  }

  if (!job) {
    return <div className="container page-wrapper" style={{ textAlign: 'center', padding: '5rem 0' }}>Job position not found.</div>;
  }

  return (
    <div className="container page-wrapper" style={{ maxWidth: '850px' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '1.5rem', padding: '0.4rem 0.85rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <span className="company-badge" style={{ marginBottom: '0.75rem' }}>
              <Building size={14} /> {job.company?.name}
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.5rem' }}>{job.title}</h1>
          </div>

          <button
            onClick={() => {
              if (!isAuthenticated) navigate('/login');
              else setShowModal(true);
            }}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.75rem' }}
          >
            <Send size={18} /> Apply For This Role
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '1rem 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', margin: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {job.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} color="var(--primary)" /> <span>{job.location}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <DollarSign size={16} color="var(--success)" /> 
            <span>${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max / 1000).toFixed(0)}k / yr</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} color="var(--secondary)" /> 
            <span style={{ textTransform: 'capitalize' }}>{job.employment_type?.replace('_', ' ')}</span>
          </div>
        </div>

        {job.skills && job.skills.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>REQUIRED SKILLS</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {job.skills.map((s) => (
                <span key={s.skill_id} className="skill-tag" style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem' }}>Job Description</h3>
          <p style={{ whiteSpace: 'pre-line', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            {job.description || 'No detailed description provided.'}
          </p>
        </div>
      </div>

      {showModal && (
        <ApplicationModal
          job={job}
          onClose={() => setShowModal(false)}
          onSubmit={handleApplySubmit}
          loading={applying}
          error={applyError}
        />
      )}
    </div>
  );
};
