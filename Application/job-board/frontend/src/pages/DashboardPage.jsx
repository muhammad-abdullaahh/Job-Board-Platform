import React, { useState, useEffect } from 'react';
import { Briefcase, Send, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { fetchMyApplicationsApi } from '../api/applicationsApi';
import { createJobApi } from '../api/jobsApi';
import { fetchCompaniesApi } from '../api/authApi'; // helper or company api
import { StatusBadge } from '../components/StatusBadge';

export const DashboardPage = () => {
  const { user, token } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Post Job modal state
  const [showJobModal, setShowJobModal] = useState(false);
  const [companyId, setCompanyId] = useState('1');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('80000');
  const [salaryMax, setSalaryMax] = useState('120000');
  const [employmentType, setEmploymentType] = useState('full_time');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (token && user?.role === 'user') {
      fetchMyApplicationsApi(token)
        .then((data) => setApplications(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, user]);

  const handlePostJob = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      await createJobApi({
        company_id: parseInt(companyId),
        title,
        description,
        location,
        salary_min: parseInt(salaryMin),
        salary_max: parseInt(salaryMax),
        employment_type: employmentType,
        status: 'open'
      }, token);
      setShowJobModal(false);
      alert('New Job Posting published successfully!');
      setTitle('');
      setDescription('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to publish job posting.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="container page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800' }}>
            {user?.role === 'admin' ? 'Administrator Control Dashboard' : 'User Dashboard'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Welcome back, {user?.name}! Manage your activity below.
          </p>
        </div>

        <button onClick={() => setShowJobModal(true)} className="btn btn-primary">
          <PlusCircle size={18} /> Post New Job
        </button>
      </div>

      {/* Applications Section */}
      {user?.role === 'user' && (
        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Send size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700' }}>My Submitted Applications</h2>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading applications...</div>
          ) : applications.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              You haven't submitted any job applications yet. Browse jobs to get started!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {applications.map((app) => (
                <div key={app.application_id} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', marginBottom: '0.25rem' }}>
                      {app.job?.title || `Job #${app.job_id}`}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      Submitted on {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <StatusBadge status={app.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modal for posting new job */}
      {showJobModal && (
        <div className="modal-overlay" onClick={() => setShowJobModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem' }}>Post a New Job Opening</h2>

            <form onSubmit={handlePostJob}>
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Company ID</label>
                  <input
                    type="number"
                    className="form-control"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Remote / New York"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Min Salary ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Max Salary ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
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
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>

              <div className="form-group">
                <label>Job Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Responsibilities, requirements, team culture..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowJobModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={posting} className="btn btn-primary">
                  {posting ? 'Publishing...' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
