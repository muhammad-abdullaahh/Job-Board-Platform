import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { fetchMyApplicationsApi, fetchJobApplicationsApi, updateApplicationStatusApi } from '../api/applicationsApi';
import { fetchCompaniesApi } from '../api/companiesApi';
import { fetchJobsApi } from '../api/jobsApi';
import { verifyCompanyApi } from '../api/adminApi';
import { StatusBadge } from '../components/StatusBadge';
import { OfferTimerBadge } from '../components/OfferTimerBadge';
import { CompanyRegisterModal } from '../components/CompanyRegisterModal';
import { JobCreateModal } from '../components/JobCreateModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [myCompany, setMyCompany] = useState(null);
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJobApps, setSelectedJobApps] = useState({});
  const [activeJobId, setActiveJobId] = useState(null);

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Load candidate applications
      const appsData = await fetchMyApplicationsApi().catch(() => []);
      setApplications(appsData || []);

      // 2. Load companies
      const compsData = await fetchCompaniesApi().catch(() => []);
      setCompanies(compsData || []);

      // 3. Find company owned by logged in user
      if (user && user.user_id) {
        const found = compsData.find((c) => c.updated_by === user.user_id || c.owner_user_id === user.user_id);
        setMyCompany(found || null);

        if (found && found.company_id) {
          const companyJobs = await fetchJobsApi({ company_id: found.company_id }).catch(() => []);
          setMyJobs(companyJobs || []);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const handleVerifyCompany = async (companyId) => {
    try {
      await verifyCompanyApi(companyId);
      setActionMessage('Company verified successfully!');
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to verify company.');
    }
  };

  const handleFetchApplicationsForJob = async (jobId) => {
    if (activeJobId === jobId) {
      setActiveJobId(null);
      return;
    }
    setActiveJobId(jobId);
    try {
      const apps = await fetchJobApplicationsApi(jobId);
      setSelectedJobApps((prev) => ({ ...prev, [jobId]: apps || [] }));
    } catch (err) {
      console.error('Failed to load applications for job:', err);
    }
  };

  const handleStatusChange = async (appId, newStatus, jobId) => {
    try {
      await updateApplicationStatusApi(appId, newStatus);
      setActionMessage(`Application status updated to "${newStatus.replace('_', ' ')}"`);
      if (jobId) {
        const apps = await fetchJobApplicationsApi(jobId);
        setSelectedJobApps((prev) => ({ ...prev, [jobId]: apps || [] }));
      }
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status.');
    }
  };

  const isAdmin = user?.role === 'admin' || user?.is_admin;

  return (
    <div className="page-container dashboard-page">
      {/* Header Banner */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Welcome back, <strong style={{ color: 'var(--primary)' }}>{user?.name || user?.email}</strong> ({isAdmin ? 'System Administrator' : myCompany ? 'Employer' : 'Candidate'})
          </p>
        </div>
        {!myCompany && !isAdmin && (
          <button onClick={() => setShowCompanyModal(true)} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            🏢 Register a Company &rarr;
          </button>
        )}
      </div>

      {actionMessage && <div className="success-banner" style={{ marginBottom: '2rem' }}>{actionMessage}</div>}

      {/* --- COMPANY / EMPLOYER SECTION --- */}
      <section className="dashboard-section" style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏢 Company & Employer Profile
        </h2>

        {myCompany ? (
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>{myCompany.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>📍 {myCompany.location || 'Location Not Specified'} • Website: {myCompany.website || 'N/A'}</p>
              </div>
              <div>
                {myCompany.is_verified ? (
                  <span className="badge status-accepted" style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}>
                    ✓ Verified Employer
                  </span>
                ) : (
                  <span className="badge status-applied" style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}>
                    ⏳ Pending Admin Approval
                  </span>
                )}
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {myCompany.description || 'No description provided.'}
            </p>

            {myCompany.is_verified ? (
              <div style={{ background: 'var(--primary-subtle)', border: '1px solid var(--border-emerald)', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Your company profile is verified! You can publish listings and review applications.</span>
                <button onClick={() => setShowJobModal(true)} className="btn btn-emerald">
                  + Post a New Job
                </button>
              </div>
            ) : (
              <div style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', color: '#EAB308' }}>
                💡 <strong>Approval Pending:</strong> Your company profile is undergoing administrator review. Once verified, job posting capabilities will be enabled.
              </div>
            )}

            {/* Managed Jobs Section for Employers */}
            {myCompany.is_verified && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '1.15rem', color: 'var(--primary)' }}>Posted Jobs & Applications ({myJobs.length})</h4>
                {myJobs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>You haven't posted any jobs yet. Click "+ Post a New Job" above to create your first listing.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {myJobs.map((job) => (
                      <div key={job.job_id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.2rem', background: 'var(--surface-elevated)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <strong style={{ fontSize: '1.1rem', color: '#FFFFFF' }}>{job.title}</strong>
                            <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {job.location || 'Remote'}</span>
                          </div>
                          <button
                            onClick={() => handleFetchApplicationsForJob(job.job_id)}
                            className="btn btn-outline"
                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
                          >
                            {activeJobId === job.job_id ? 'Hide Applications' : 'View Received Applications'}
                          </button>
                        </div>

                        {/* Expandable Applicants List for this Job */}
                        {activeJobId === job.job_id && (
                          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                            <h5 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                              Candidate Applications for {job.title}:
                            </h5>
                            {!selectedJobApps[job.job_id] || selectedJobApps[job.job_id].length === 0 ? (
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No applications received for this job yet.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {selectedJobApps[job.job_id].map((applicantApp) => (
                                  <div key={applicantApp.application_id} style={{ background: 'var(--surface-card)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div>
                                      <strong style={{ color: 'var(--text-main)' }}>{applicantApp.applicant?.name || applicantApp.applicant?.email || `Applicant #${applicantApp.user_id}`}</strong>
                                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>
                                        {applicantApp.cover_letter}
                                      </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <StatusBadge status={applicantApp.status} />
                                      <select
                                        value={applicantApp.status}
                                        onChange={(e) => handleStatusChange(applicantApp.application_id, e.target.value, job.job_id)}
                                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', borderRadius: '6px', background: 'var(--bg-main)', color: '#FFFFFF', border: '1px solid var(--border-light)' }}
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="reviewed">Reviewed</option>
                                        <option value="shortlisted">Shortlisted</option>
                                        <option value="offer_issued">Issue Offer</option>
                                        <option value="hired">Hired</option>
                                        <option value="rejected">Reject</option>
                                      </select>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--surface-card)', border: '1px dashed var(--primary-light)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Want to hire top talent?</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
              Register your company profile on JobBoard. Once an Administrator reviews and approves your organization, you will unlock full employer privileges to post jobs and evaluate candidate applications.
            </p>
            <button onClick={() => setShowCompanyModal(true)} className="btn btn-primary">
              + Register Your Company Now
            </button>
          </div>
        )}
      </section>

      {/* --- ADMIN APPROVAL PANEL (Visible to Admins) --- */}
      {isAdmin && (
        <section className="dashboard-section" style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#F8FAFC', margin: 0 }}>
              👑 Admin Verification Panel
            </h2>
            <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#EAB308', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              Organization Governance
            </span>
          </div>

          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-emerald)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-md)' }}>
            {companies.filter(c => !c.is_verified).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>All registered companies are currently verified.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {companies.filter(c => !c.is_verified).map((comp) => (
                  <div key={comp.company_id || comp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.35rem 1.5rem', border: '1px solid var(--border-emerald)', borderRadius: 'var(--radius-md)', background: 'var(--surface-elevated)', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                        <h4 style={{ color: 'var(--primary)', fontSize: '1.25rem', margin: 0 }}>{comp.name}</h4>
                        <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>ID #{comp.company_id}</span>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        📍 Location: <strong>{comp.location || 'N/A'}</strong> {comp.website && <>• 🌐 <a href={comp.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{comp.website}</a></>}
                      </p>

                      {/* Audit Verification Metadata Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', background: 'var(--surface-card)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          👥 <strong>Company Size:</strong> {comp.employee_count || 'Not Specified'}
                        </div>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          📧 <strong>HR Email:</strong> {comp.hr_contact_email ? <a href={`mailto:${comp.hr_contact_email}`} style={{ color: 'var(--primary)' }}>{comp.hr_contact_email}</a> : 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          🔗 <strong>CRO/Executive LinkedIn:</strong> {comp.cro_linkedin ? <a href={comp.cro_linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>View Profile &rarr;</a> : 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          📑 <strong>Registration/Tax ID:</strong> {comp.registration_number || 'N/A'}
                        </div>
                      </div>

                      {comp.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          "{comp.description}"
                        </p>
                      )}
                    </div>

                    <button onClick={() => handleVerifyCompany(comp.company_id || comp.id)} className="btn btn-emerald" style={{ padding: '0.65rem 1.35rem', fontSize: '0.875rem', alignSelf: 'center' }}>
                      ✓ Approve & Verify Company
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- MY CANDIDATE APPLICATIONS SECTION --- */}
      <section className="dashboard-section">
        <h2 style={{ marginBottom: '1.25rem' }}>My Candidate Applications</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading applications...</p>
        ) : applications.length === 0 ? (
          <div style={{ background: 'var(--surface-card)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No applications submitted yet. Browse jobs to submit your first application!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {applications.map((app) => (
              <div key={app.application_id || app.id} style={{ background: 'var(--surface-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', margin: 0 }}>
                      {app.job?.title || app.job_title || 'Position'}
                    </h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    Company: <strong>{app.job?.company?.name || 'Employer'}</strong>
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    Applied on: {new Date(app.created_at || Date.now()).toLocaleDateString()}
                  </p>
                </div>

                {/* Offer Action Buttons for Candidates */}
                {app.status === 'offer_issued' && (
                  <div style={{ borderTop: '1px solid var(--border-emerald)', background: 'var(--primary-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                    <OfferTimerBadge expiresAt={app.offer_expires_at} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--primary)', margin: '0.5rem 0 0.75rem 0', fontWeight: 600 }}>
                      Congratulations! An offer has been issued for this position.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleStatusChange(app.application_id, 'offer_accepted')}
                        className="btn btn-emerald"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.85rem' }}
                      >
                        Accept Offer
                      </button>
                      <button
                        onClick={() => handleStatusChange(app.application_id, 'offer_declined')}
                        className="btn btn-outline"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.85rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#EF4444' }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {showCompanyModal && (
        <CompanyRegisterModal
          onClose={() => setShowCompanyModal(false)}
          onSuccess={() => {
            setActionMessage('Company submitted! It is currently pending administrator verification.');
            loadDashboardData();
          }}
        />
      )}

      {showJobModal && myCompany && (
        <JobCreateModal
          companyId={myCompany.company_id}
          onClose={() => setShowJobModal(false)}
          onSuccess={() => {
            setActionMessage('Job posting created successfully!');
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
