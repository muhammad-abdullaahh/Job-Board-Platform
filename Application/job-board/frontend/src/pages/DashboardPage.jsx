import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Building,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit,
  Users,
  ShieldCheck,
  Tag,
  Clock,
  Send,
  Eye,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import {
  fetchMyApplicationsApi,
  fetchJobApplicationsApi,
  updateApplicationStatusApi,
} from '../api/applicationsApi';
import { createJobApi, deleteJobApi, fetchJobsApi } from '../api/jobsApi';
import {
  createCompanyApi,
  renameCompanyApi,
  fetchCompaniesApi,
} from '../api/companiesApi';
import { fetchSkillsApi, createSkillApi } from '../api/skillsApi';
import { fetchUsersApi, deleteUserApi, verifyCompanyApi } from '../api/adminApi';
import { StatusBadge } from '../components/StatusBadge';
import { OfferTimerBadge } from '../components/OfferTimerBadge';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('applications');

  // Candidate Data State
  const [myApplications, setMyApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);

  // Employer Data State
  const [postedJobs, setPostedJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);

  // Employer Review Applicants Modal State
  const [selectedJobForReview, setSelectedJobForReview] = useState(null);
  const [jobApplicants, setJobApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Post Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('full_time');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // Company Form State
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [renameTargetId, setRenameTargetId] = useState(null);
  const [newCompanyName, setNewCompanyName] = useState('');

  // Admin Management State
  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = () => {
    // 1. Fetch Candidate Applications
    fetchMyApplicationsApi()
      .then((data) => {
        setMyApplications(data);
        setLoadingApps(false);
      })
      .catch(() => setLoadingApps(false));

    // 2. Fetch Jobs & Companies (For Employers & Admins)
    fetchJobsApi()
      .then((data) => setPostedJobs(data))
      .catch(() => {});

    fetchCompaniesApi()
      .then((data) => {
        setCompanies(data);
        if (data.length > 0) setSelectedCompanyId(data[0].company_id);
      })
      .catch(() => {});

    // 3. Fetch Admin Data (Skills & Users)
    if (user?.role === 'admin') {
      fetchSkillsApi()
        .then((data) => setSkills(data))
        .catch(() => {});
      fetchUsersApi()
        .then((data) => setAllUsers(data))
        .catch(() => {});
    }
  };

  // --- CANDIDATE ACTIONS ---
  const handleOfferDecision = async (applicationId, statusDecision) => {
    try {
      await updateApplicationStatusApi(applicationId, statusDecision);
      alert(`Offer ${statusDecision === 'offer_accepted' ? 'Accepted! Congratulations!' : 'Declined.'}`);
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update offer status.');
    }
  };

  // --- EMPLOYER ACTIONS ---
  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      alert('Please register/select a company profile first.');
      return;
    }

    try {
      await createJobApi({
        title: jobTitle,
        description: jobDescription,
        location: jobLocation,
        employment_type: employmentType,
        salary_min: Number(salaryMin),
        salary_max: Number(salaryMax),
        company_id: Number(selectedCompanyId),
        status: 'open',
      });
      alert('Job posting published successfully!');
      setShowPostJobModal(false);
      setJobTitle('');
      setJobDescription('');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to post job.');
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await createCompanyApi({
        name: companyName,
        website: companyWebsite,
        location: companyLocation,
      });
      alert('Company profile created successfully!');
      setShowCompanyModal(false);
      setCompanyName('');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create company.');
    }
  };

  const handleRenameCompany = async (e) => {
    e.preventDefault();
    if (!renameTargetId || !newCompanyName.trim()) return;

    try {
      await renameCompanyApi(renameTargetId, newCompanyName);
      alert('Company renamed successfully!');
      setShowRenameModal(false);
      setNewCompanyName('');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to rename company.');
    }
  };

  const handleDeleteJob = async (jobId, companyId) => {
    if (!window.confirm('Are you sure you want to soft-delete this job posting?')) return;
    try {
      await deleteJobApi(jobId, companyId);
      alert('Job deleted successfully.');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete job.');
    }
  };

  // Open Applicants Review Modal
  const handleOpenReviewModal = (job) => {
    setSelectedJobForReview(job);
    setLoadingApplicants(true);
    fetchJobApplicationsApi(job.job_id)
      .then((data) => {
        setJobApplicants(data);
        setLoadingApplicants(false);
      })
      .catch(() => setLoadingApplicants(false));
  };

  // Employer Update Candidate Application Status (Issue Offer, Shortlist, Reject)
  const handleUpdateApplicantStatus = async (applicationId, newStatus) => {
    try {
      await updateApplicationStatusApi(applicationId, newStatus);
      alert(
        newStatus === 'offer_issued'
          ? 'Offer letter issued! 48-Hour timer started for the candidate.'
          : `Candidate status updated to '${newStatus}'.`
      );
      // Reload modal applicants list
      if (selectedJobForReview) handleOpenReviewModal(selectedJobForReview);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update application status.');
    }
  };

  // --- ADMIN ACTIONS ---
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      await createSkillApi(newSkillName);
      setNewSkillName('');
      fetchSkillsApi().then((data) => setSkills(data));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create skill tag.');
    }
  };

  const handleVerifyCompany = async (companyId) => {
    try {
      await verifyCompanyApi(companyId);
      alert('Company verified successfully!');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to verify company.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to soft-delete this user?')) return;
    try {
      await deleteUserApi(userId);
      alert('User soft-deleted successfully.');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  return (
    <div className="container section-padding">
      {/* Dashboard Header */}
      <div className="dashboard-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Welcome, {user?.name || user?.email}</h1>
          <p className="subtitle">
            Role: <strong>{user?.role === 'admin' ? 'Administrator / Employer' : 'Candidate'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowCompanyModal(true)} className="btn btn-secondary btn-sm">
            <Building size={16} /> Register Company
          </button>
          <button onClick={() => setShowPostJobModal(true)} className="btn btn-primary btn-sm">
            <Plus size={16} /> Post New Job
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          <Briefcase size={16} /> My Applications ({myApplications.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'manage_jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage_jobs')}
        >
          <Building size={16} /> Posted Jobs & Applicants ({postedJobs.length})
        </button>

        {user?.role === 'admin' && (
          <>
            <button
              className={`tab-btn ${activeTab === 'admin_companies' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin_companies')}
            >
              <ShieldCheck size={16} /> Verify Companies ({companies.filter(c => !c.is_verified).length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'admin_users' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin_users')}
            >
              <Users size={16} /> Manage Users ({allUsers.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'admin_skills' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin_skills')}
            >
              <Tag size={16} /> Manage Skills ({skills.length})
            </button>
          </>
        )}
      </div>

      {/* TAB 1: MY APPLICATIONS (Candidate View) */}
      {activeTab === 'applications' && (
        <div className="tab-content">
          {loadingApps ? (
            <div className="loading-spinner">Loading your applications...</div>
          ) : myApplications.length === 0 ? (
            <div className="card text-center" style={{ padding: '48px' }}>
              <p className="subtitle">You haven't submitted any job applications yet.</p>
            </div>
          ) : (
            <div className="grid-gap">
              {myApplications.map((app) => (
                <div key={app.application_id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3>{app.job?.title || `Job #${app.job_id}`}</h3>
                      <p className="subtitle" style={{ margin: '4px 0 12px' }}>
                        {app.job?.company?.name || 'Company Profile'}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <div style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                    <strong style={{ fontSize: '14px' }}>Cover Letter:</strong>
                    <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{app.cover_letter}</p>
                  </div>

                  {/* 48-Hour Offer Acceptance Window Banner */}
                  {app.status === 'offer_issued' && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-warning)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <strong style={{ color: '#B45309' }}>🎉 Offer Letter Issued!</strong>
                          <p className="subtitle" style={{ fontSize: '13px' }}>You have 48 hours to accept or decline this offer.</p>
                        </div>
                        <OfferTimerBadge offerExpiresAt={app.offer_expires_at} />
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => handleOfferDecision(app.application_id, 'offer_accepted')}
                          className="btn btn-success btn-sm"
                        >
                          <CheckCircle size={16} /> Accept Offer
                        </button>
                        <button
                          onClick={() => handleOfferDecision(app.application_id, 'offer_declined')}
                          className="btn btn-danger btn-sm"
                        >
                          <XCircle size={16} /> Decline Offer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EMPLOYER JOB POSTINGS & APPLICANTS */}
      {activeTab === 'manage_jobs' && (
        <div className="tab-content">
          {postedJobs.length === 0 ? (
            <div className="card text-center" style={{ padding: '48px' }}>
              <p className="subtitle">No job postings created yet.</p>
              <button onClick={() => setShowPostJobModal(true)} className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
                <Plus size={16} /> Post Your First Job
              </button>
            </div>
          ) : (
            <div className="grid-gap">
              {postedJobs.map((job) => (
                <div key={job.job_id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3>{job.title}</h3>
                      <p className="subtitle">{job.company?.name || 'Company'} • {job.location || 'Remote'}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <StatusBadge status={job.status} />
                      <button
                        onClick={() => handleOpenReviewModal(job)}
                        className="btn btn-primary btn-sm"
                      >
                        <Eye size={16} /> View Applicants
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.job_id, job.company_id)}
                        className="btn btn-danger btn-sm"
                        title="Delete Job"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADMIN COMPANY VERIFICATION QUEUE */}
      {activeTab === 'admin_companies' && user?.role === 'admin' && (
        <div className="tab-content card">
          <h2>Registered Companies Queue</h2>
          <div className="grid-gap" style={{ marginTop: '16px' }}>
            {companies.map((comp) => (
              <div key={comp.company_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <h3>{comp.name}</h3>
                  <p className="subtitle">{comp.website || 'No website'} • {comp.location || 'Remote'}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {comp.is_verified ? (
                    <span className="verified-dot">✓ Verified</span>
                  ) : (
                    <button
                      onClick={() => handleVerifyCompany(comp.company_id)}
                      className="btn btn-primary btn-sm"
                    >
                      <ShieldCheck size={16} /> Verify Company
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setRenameTargetId(comp.company_id);
                      setNewCompanyName(comp.name);
                      setShowRenameModal(true);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit size={14} /> Rename
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ADMIN USER MANAGEMENT */}
      {activeTab === 'admin_users' && user?.role === 'admin' && (
        <div className="tab-content card">
          <h2>Platform Users</h2>
          <div className="grid-gap" style={{ marginTop: '16px' }}>
            {allUsers.map((u) => (
              <div key={u.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <strong>{u.name}</strong> <span className="subtitle">({u.email})</span>
                  {u.is_admin && <span className="admin-chip">Admin</span>}
                </div>
                <button
                  onClick={() => handleDeleteUser(u.user_id)}
                  className="btn btn-danger btn-sm"
                >
                  <Trash2 size={14} /> Soft Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ADMIN SKILL MANAGEMENT */}
      {activeTab === 'admin_skills' && user?.role === 'admin' && (
        <div className="tab-content card">
          <h2>Global Platform Skills</h2>
          <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '12px', margin: '16px 0' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Add new skill tag (e.g. Next.js, FastAPI)..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">
              Add Skill
            </button>
          </form>

          <div className="skills-container">
            {skills.map((skill) => (
              <span key={skill.skill_id} className="skill-pill">
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: REVIEW JOB APPLICANTS (EMPLOYER FLOW) */}
      {selectedJobForReview && (
        <div className="modal-overlay" onClick={() => setSelectedJobForReview(null)}>
          <div className="modal-card" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Applicants for {selectedJobForReview.title}</h2>
                <p className="subtitle">{jobApplicants.length} Total Applications Received</p>
              </div>
              <button className="icon-button" onClick={() => setSelectedJobForReview(null)}>
                <X size={20} />
              </button>
            </div>

            {loadingApplicants ? (
              <div className="loading-spinner">Fetching applicant details...</div>
            ) : jobApplicants.length === 0 ? (
              <div className="text-center" style={{ padding: '24px' }}>
                <p className="subtitle">No applications submitted for this job yet.</p>
              </div>
            ) : (
              <div className="grid-gap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {jobApplicants.map((app) => (
                  <div key={app.application_id} style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Applicant #{app.user_id}</strong>
                        <p className="subtitle" style={{ fontSize: '13px' }}>Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>

                    <div style={{ margin: '12px 0', background: '#FFFFFF', padding: '12px', borderRadius: '6px' }}>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{app.cover_letter}</p>
                    </div>

                    {/* Status Action Controls for Employer */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleUpdateApplicantStatus(app.application_id, 'shortlisted')}
                        className="btn btn-secondary btn-sm"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleUpdateApplicantStatus(app.application_id, 'offer_issued')}
                        className="btn btn-primary btn-sm"
                      >
                        <Send size={14} /> Issue Offer Letter (48h Timer)
                      </button>
                      <button
                        onClick={() => handleUpdateApplicantStatus(app.application_id, 'rejected')}
                        className="btn btn-danger btn-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: POST JOB */}
      {showPostJobModal && (
        <div className="modal-overlay" onClick={() => setShowPostJobModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Post a New Job</h2>
            <form onSubmit={handlePostJob} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>Company Profile</label>
                <select
                  className="form-control"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  required
                >
                  {companies.map((c) => (
                    <option key={c.company_id} value={c.company_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  placeholder="Senior React Developer"
                  className="form-control"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={4}
                  className="form-control"
                  placeholder="Job duties, requirements, expectations..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="Remote / San Francisco, CA"
                  className="form-control"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Min Salary ($)</label>
                  <input
                    type="number"
                    placeholder="90000"
                    className="form-control"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Max Salary ($)</label>
                  <input
                    type="number"
                    placeholder="140000"
                    className="form-control"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPostJobModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER COMPANY */}
      {showCompanyModal && (
        <div className="modal-overlay" onClick={() => setShowCompanyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Register Company Profile</h2>
            <form onSubmit={handleCreateCompany} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  placeholder="Acme Corp"
                  className="form-control"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Website URL</label>
                <input
                  type="url"
                  placeholder="https://acme.com"
                  className="form-control"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="New York, NY"
                  className="form-control"
                  value={companyLocation}
                  onChange={(e) => setCompanyLocation(e.target.value)}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompanyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RENAME COMPANY */}
      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Rename Company Profile</h2>
            <form onSubmit={handleRenameCompany} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>New Company Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRenameModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
