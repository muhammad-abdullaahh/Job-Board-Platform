import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { fetchMyApplicationsApi, fetchJobApplicationsApi, updateApplicationStatusApi } from '../api/applicationsApi';
import { fetchUserProfileApi, updateUserProfileApi } from '../api/usersApi';
import { fetchCompaniesApi, deleteCompanyApi } from '../api/companiesApi';
import { fetchJobsApi } from '../api/jobsApi';
import {
  verifyCompanyApi,
  fetchUsersApi,
  toggleUserAdminApi,
  deleteUserApi,
  restoreUserApi,
  fetchAdminAnalyticsApi,
  fetchAdminJobsApi,
  updateAdminJobStatusApi,
  deleteAdminJobApi,
  toggleCompanyVerifyApi,
} from '../api/adminApi';
import {
  fetchSkillsApi,
  createSkillApi,
  updateSkillApi,
  deleteSkillApi,
} from '../api/skillsApi';
import { StatusBadge } from '../components/StatusBadge';
import { OfferTimerBadge } from '../components/OfferTimerBadge';
import { CompanyRegisterModal } from '../components/CompanyRegisterModal';
import { CompanyEditModal } from '../components/CompanyEditModal';
import { JobCreateModal } from '../components/JobCreateModal';

export const DashboardPage = () => {
  const { user, setUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [myCompany, setMyCompany] = useState(null);
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJobApps, setSelectedJobApps] = useState({});
  const [activeJobId, setActiveJobId] = useState(null);

  // Candidate / User Profile & Skills state
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    years_of_experience: 0,
    skill_ids: [],
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [userSkillFilter, setUserSkillFilter] = useState('');

  // Admin state & Tabs
  const [adminTab, setAdminTab] = useState('analytics'); // 'analytics', 'jobs', 'companies', 'skills', 'users'
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [analytics, setAnalytics] = useState(null);

  // Job moderation state
  const [adminJobs, setAdminJobs] = useState([]);
  const [adminJobSearch, setAdminJobSearch] = useState('');
  const [adminJobStatusFilter, setAdminJobStatusFilter] = useState('all');

  // Company profile manager state
  const [companyFilter, setCompanyFilter] = useState('all');
  const [companySearch, setCompanySearch] = useState('');
  const [editingCompany, setEditingCompany] = useState(null);

  // Skills taxonomy state
  const [skillsList, setSkillsList] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editingSkillName, setEditingSkillName] = useState('');

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

      // 3. Load user personal profile & attached skills
      const profileData = await fetchUserProfileApi().catch(() => null);
      if (profileData) {
        setProfileForm({
          name: profileData.name || '',
          bio: profileData.bio || '',
          years_of_experience: profileData.years_of_experience || 0,
          skill_ids: (profileData.skills || []).map((s) => s.skill_id),
        });
      }

      // 4. Load predefined platform skills for candidate tagging and admin taxonomy
      const allSkills = await fetchSkillsApi().catch(() => []);
      setSkillsList(allSkills || []);

      // 5. Find company owned by logged in user
      if (user && user.user_id) {
        const found = compsData.find((c) => c.updated_by === user.user_id || c.owner_user_id === user.user_id);
        setMyCompany(found || null);

        if (found && found.company_id) {
          const companyJobs = await fetchJobsApi({ company_id: found.company_id }).catch(() => []);
          setMyJobs(companyJobs || []);
        }
      }

      // 6. Load users list, analytics, and all jobs if user is Admin
      if (user && (user.is_admin || user.role === 'admin')) {
        const [usersData, analyticsData, jobsData] = await Promise.all([
          fetchUsersApi().catch(() => []),
          fetchAdminAnalyticsApi().catch(() => null),
          fetchAdminJobsApi().catch(() => []),
        ]);
        setUsersList(usersData || []);
        setAnalytics(analyticsData);
        setAdminJobs(jobsData || []);
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
      if (newStatus === 'offer_accepted') {
        setActionMessage('🎉 Congratulations! You have accepted the offer. The position has been successfully filled and finalized.');
      } else {
        setActionMessage(`Application status updated to "${newStatus.replace('_', ' ')}"`);
      }
      if (jobId) {
        const apps = await fetchJobApplicationsApi(jobId).catch(() => []);
        setSelectedJobApps((prev) => ({ ...prev, [jobId]: apps || [] }));
      }
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status.');
    }
  };

  const handleToggleAdmin = async (targetUserId, currentIsAdmin) => {
    try {
      await toggleUserAdminApi(targetUserId, !currentIsAdmin);
      setActionMessage(`User #${targetUserId} role updated to ${!currentIsAdmin ? 'Administrator' : 'Standard User'}`);
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (targetUserId, userName) => {
    if (!window.confirm(`Are you sure you want to suspend user "${userName || targetUserId}"? This will also soft-delete their companies, job listings, and applications.`)) return;
    try {
      await deleteUserApi(targetUserId);
      setActionMessage(`User #${targetUserId} suspended successfully.`);
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to suspend user.');
    }
  };

  const handleRestoreUser = async (targetUserId, userName) => {
    try {
      await restoreUserApi(targetUserId);
      setActionMessage(`User #${targetUserId} (${userName || ''}) reactivated successfully.`);
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reactivate user.');
    }
  };

  const handleUpdateJobStatus = async (jobId, newStatus) => {
    try {
      await updateAdminJobStatusApi(jobId, newStatus);
      setActionMessage(`Job #${jobId} status updated to "${newStatus}".`);
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update job status.');
    }
  };

  const handleDeleteJobAdmin = async (jobId, title) => {
    if (!window.confirm(`Are you sure you want to delete job "${title || jobId}"? This cannot be undone.`)) return;
    try {
      await deleteAdminJobApi(jobId);
      setActionMessage(`Job #${jobId} deleted successfully.`);
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete job.');
    }
  };

  const handleToggleCompanyVerification = async (companyId, currentVerified) => {
    try {
      await toggleCompanyVerifyApi(companyId, !currentVerified);
      setActionMessage(`Company #${companyId} verification ${!currentVerified ? 'approved' : 'revoked'}.`);
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update company verification.');
    }
  };

  const handleDeleteCompany = async (companyId, companyName) => {
    if (!window.confirm(`Are you sure you want to delete company "${companyName}"? This will soft-delete all its job postings and applications.`)) return;
    try {
      await deleteCompanyApi(companyId);
      setActionMessage(`Company "${companyName}" deleted successfully.`);
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete company.');
    }
  };

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      await createSkillApi(newSkillName.trim());
      setActionMessage(`Skill "${newSkillName.trim()}" added to platform taxonomy!`);
      setNewSkillName('');
      const updatedSkills = await fetchSkillsApi().catch(() => []);
      setSkillsList(updatedSkills || []);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create skill.');
    }
  };

  const handleUpdateSkill = async (skillId) => {
    if (!editingSkillName.trim()) return;
    try {
      await updateSkillApi(skillId, editingSkillName.trim());
      setActionMessage(`Skill #${skillId} updated successfully.`);
      setEditingSkillId(null);
      setEditingSkillName('');
      const updatedSkills = await fetchSkillsApi().catch(() => []);
      setSkillsList(updatedSkills || []);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update skill.');
    }
  };

  const handleDeleteSkill = async (skillId, skillName) => {
    if (!window.confirm(`Are you sure you want to delete skill "${skillName}"? It will be removed from all candidate profiles and job tags.`)) return;
    try {
      await deleteSkillApi(skillId);
      setActionMessage(`Skill "${skillName}" removed successfully.`);
      const updatedSkills = await fetchSkillsApi().catch(() => []);
      setSkillsList(updatedSkills || []);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete skill.');
    }
  };

  const handleToggleProfileSkill = (skillId) => {
    setProfileForm((prev) => {
      const exists = prev.skill_ids.includes(skillId);
      const newSkillIds = exists
        ? prev.skill_ids.filter((id) => id !== skillId)
        : [...prev.skill_ids, skillId];
      return { ...prev, skill_ids: newSkillIds };
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const updated = await updateUserProfileApi({
        name: profileForm.name,
        bio: profileForm.bio,
        years_of_experience: Number(profileForm.years_of_experience) || 0,
        skill_ids: profileForm.skill_ids,
      });
      if (setUser) {
        setUser((prev) => ({
          ...prev,
          name: updated.name,
        }));
      }
      setActionMessage('✅ Profile and skills saved successfully!');
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.is_admin;

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      String(u.user_id).includes(userSearch);
    if (!matchesSearch) return false;
    if (userRoleFilter === 'admin') return u.is_admin;
    if (userRoleFilter === 'regular') return !u.is_admin;
    if (userRoleFilter === 'active') return !u.deleted_at;
    if (userRoleFilter === 'suspended') return !!u.deleted_at;
    return true;
  });

  const filteredAdminJobs = adminJobs.filter((job) => {
    const searchLower = adminJobSearch.toLowerCase();
    const matchesSearch =
      (job.title && job.title.toLowerCase().includes(searchLower)) ||
      (job.location && job.location.toLowerCase().includes(searchLower)) ||
      (job.company?.name && job.company.name.toLowerCase().includes(searchLower)) ||
      String(job.job_id).includes(searchLower);
    if (!matchesSearch) return false;
    if (adminJobStatusFilter === 'open') return job.status === 'open';
    if (adminJobStatusFilter === 'closed') return job.status === 'closed';
    if (adminJobStatusFilter === 'draft') return job.status === 'draft';
    return true;
  });

  const filteredCompanies = companies.filter((c) => {
    const searchLower = companySearch.toLowerCase();
    const matchesSearch =
      (c.name && c.name.toLowerCase().includes(searchLower)) ||
      (c.location && c.location.toLowerCase().includes(searchLower)) ||
      (c.registration_number && c.registration_number.toLowerCase().includes(searchLower)) ||
      (c.hr_contact_email && c.hr_contact_email.toLowerCase().includes(searchLower)) ||
      String(c.company_id || c.id).includes(searchLower);
    if (!matchesSearch) return false;
    if (companyFilter === 'verified') return c.is_verified;
    if (companyFilter === 'pending') return !c.is_verified;
    return true;
  });

  const filteredSkills = skillsList.filter((s) =>
    s.name && s.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

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

      {/* --- MY PROFILE & PLATFORM SKILLS SECTION --- */}
      <section className="dashboard-section" style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.6rem' }}>
              👤 My Profile & Candidate Skills
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Update your background and tag predefined skills set by platform administrators to increase matching with employers.
            </p>
          </div>
          <span className="badge" style={{ background: 'rgba(0, 230, 165, 0.12)', color: 'var(--primary)', border: '1px solid var(--border-emerald)' }}>
            {profileForm.skill_ids.length} Skills Attached
          </span>
        </div>

        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Left Column: Basic Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-elevated)', border: '1px solid var(--border-light)', color: '#FFF' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Account Email (Verified)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Years of Professional Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={profileForm.years_of_experience}
                    onChange={(e) => setProfileForm({ ...profileForm, years_of_experience: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-elevated)', border: '1px solid var(--border-light)', color: '#FFF' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Professional Bio & Career Objective
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell employers about your engineering focus, key achievements, or passions..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-elevated)', border: '1px solid var(--border-light)', color: '#FFF', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Right Column: Predefined Skills Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                      🏷️ Platform Skills ({profileForm.skill_ids.length} selected)
                    </label>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.85rem 0' }}>
                    Choose from the curated platform taxonomy set by administrators. Click any skill to toggle it on your profile.
                  </p>

                  <input
                    type="text"
                    placeholder="Search predefined skills (e.g., Python, React)..."
                    value={userSkillFilter}
                    onChange={(e) => setUserSkillFilter(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.85rem', fontSize: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: '1px solid var(--border-light)', color: '#FFF', marginBottom: '1rem' }}
                  />
                </div>

                {/* Selected Skills Chips */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                    Active On Your Profile:
                  </div>
                  {profileForm.skill_ids.length === 0 ? (
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                      No skills attached yet. Select from the available list below.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      {profileForm.skill_ids.map((id) => {
                        const skillObj = skillsList.find((s) => s.skill_id === id);
                        const skillName = skillObj ? skillObj.name : `Skill #${id}`;
                        return (
                          <span
                            key={id}
                            onClick={() => handleToggleProfileSkill(id)}
                            className="badge"
                            style={{
                              background: 'rgba(0, 230, 165, 0.2)',
                              color: 'var(--primary)',
                              border: '1px solid var(--border-emerald)',
                              padding: '0.35rem 0.65rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.825rem',
                              transition: 'transform 0.15s ease'
                            }}
                            title="Click to remove from profile"
                          >
                            <span>✓ {skillName}</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>✕</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Available Predefined Platform Skills */}
                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                    Available Platform Skills:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {skillsList
                      .filter((s) => s.name.toLowerCase().includes(userSkillFilter.toLowerCase()))
                      .map((s) => {
                        const isSelected = profileForm.skill_ids.includes(s.skill_id);
                        return (
                          <button
                            type="button"
                            key={s.skill_id}
                            onClick={() => handleToggleProfileSkill(s.skill_id)}
                            style={{
                              padding: '0.3rem 0.65rem',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.18s ease',
                              background: isSelected ? 'var(--primary)' : 'var(--surface-card)',
                              color: isSelected ? 'var(--bg-main)' : 'var(--text-secondary)',
                              border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-light)'
                            }}
                          >
                            {isSelected ? `✓ ${s.name}` : `+ ${s.name}`}
                          </button>
                        );
                      })}
                    {skillsList.length === 0 && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        No predefined skills configured by administrators yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
              <button
                type="submit"
                disabled={profileSaving}
                className="btn btn-primary"
                style={{ padding: '0.7rem 2rem', fontSize: '0.9rem' }}
              >
                {profileSaving ? 'Saving Profile...' : '💾 Save Profile & Skills'}
              </button>
            </div>
          </form>
        </div>
      </section>

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

      {/* --- ADMIN DASHBOARD & CONTROL SUITE --- */}
      {isAdmin && (
        <section className="dashboard-section" style={{ marginBottom: '3.5rem' }}>
          {/* Admin Header & Alert */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.75rem', color: '#F8FAFC', margin: 0 }}>
                  🛡️ Administrator Command Suite
                </h2>
                <span className="badge" style={{ background: 'rgba(0, 230, 165, 0.15)', color: 'var(--primary)', border: '1px solid var(--border-emerald)' }}>
                  Platform Ops
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                Live recruitment pipeline metrics, job listing moderation, company profile management, skills taxonomy, and user governance
              </p>
            </div>

            {analytics?.companies?.pending > 0 && (
              <div style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.4)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EAB308', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>⚠️</span>
                <span>{analytics.companies.pending} {analytics.companies.pending === 1 ? 'Company requires' : 'Companies require'} verification review</span>
              </div>
            )}
          </div>

          {/* Admin Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <button
              onClick={() => setAdminTab('analytics')}
              className={`btn ${adminTab === 'analytics' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              📊 Platform Overview
            </button>
            <button
              onClick={() => setAdminTab('jobs')}
              className={`btn ${adminTab === 'jobs' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              🛡️ Job Listings Moderator ({adminJobs.length})
            </button>
            <button
              onClick={() => setAdminTab('companies')}
              className={`btn ${adminTab === 'companies' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              🏢 Company Directory ({companies.length})
              {analytics?.companies?.pending > 0 && (
                <span style={{ marginLeft: '0.45rem', background: '#EAB308', color: '#000', borderRadius: '10px', padding: '0.1rem 0.45rem', fontSize: '0.72rem', fontWeight: 800 }}>
                  {analytics.companies.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setAdminTab('skills')}
              className={`btn ${adminTab === 'skills' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              🏷️ Skills Taxonomy ({skillsList.length})
            </button>
            <button
              onClick={() => setAdminTab('users')}
              className={`btn ${adminTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              👥 User Governance ({usersList.length})
            </button>
          </div>

          {/* ================= TAB 1: PLATFORM OVERVIEW & ANALYTICS ================= */}
          {adminTab === 'analytics' && analytics && (
            <div>
              {/* KPI Metric Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Users</span>
                    <span style={{ fontSize: '1.25rem' }}>👥</span>
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                    {analytics.users.total}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    👑 {analytics.users.admins} Admins • 👤 {analytics.users.candidates} Candidates
                  </div>
                </div>

                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Companies</span>
                    <span style={{ fontSize: '1.25rem' }}>🏢</span>
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                    {analytics.companies.total}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    ✓ {analytics.companies.verified} Verified • ⏳ {analytics.companies.pending} Pending Review
                  </div>
                </div>

                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Listings</span>
                    <span style={{ fontSize: '1.25rem' }}>💼</span>
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                    {analytics.jobs.active}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    📂 {analytics.jobs.total} Total Job Postings
                  </div>
                </div>

                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Applications</span>
                    <span style={{ fontSize: '1.25rem' }}>📄</span>
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                    {analytics.applications.total}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    📬 {analytics.applications.offers_issued} Active Offers Issued
                  </div>
                </div>

                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Successful Hires</span>
                    <span style={{ fontSize: '1.25rem' }}>🏆</span>
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.2rem' }}>
                    {analytics.applications.hired_or_accepted}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    🎯 Candidates Placed / Accepted
                  </div>
                </div>
              </div>

              {/* Analytical Breakdowns Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Application Funnel Breakdown */}
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1.15rem', color: '#F8FAFC', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📈</span> Application Status Pipeline
                  </h3>
                  {Object.keys(analytics.applications.status_breakdown).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No applications submitted yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {Object.entries(analytics.applications.status_breakdown).map(([statusKey, count]) => {
                        const pct = analytics.applications.total > 0 ? Math.round((count / analytics.applications.total) * 100) : 0;
                        return (
                          <div key={statusKey}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                              <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                                {statusKey.replace('_', ' ')}
                              </span>
                              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: statusKey === 'hired' || statusKey === 'offer_accepted' ? 'var(--primary)' : statusKey === 'offer_issued' ? '#38BDF8' : statusKey === 'rejected' ? '#EF4444' : '#F59E0B',
                                  transition: 'width 0.4s ease-in-out'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Job Distribution by Type */}
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1.15rem', color: '#F8FAFC', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>💼</span> Job Listings by Employment Type
                  </h3>
                  {Object.keys(analytics.jobs.employment_types).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No jobs created yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {Object.entries(analytics.jobs.employment_types).map(([typeKey, count]) => {
                        const pct = analytics.jobs.total > 0 ? Math.round((count / analytics.jobs.total) * 100) : 0;
                        return (
                          <div key={typeKey}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                              <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                                {typeKey.replace('_', ' ')}
                              </span>
                              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: 'var(--primary)',
                                  transition: 'width 0.4s ease-in-out'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: JOB POSTINGS MODERATOR ================= */}
          {adminTab === 'jobs' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#F8FAFC', margin: 0 }}>
                    🛡️ Job Listing Moderation & Content Management
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Publish, hide, close, or delete spam and misleading job postings across all organizations.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, maxWidth: '520px', justifyContent: 'flex-end' }}>
                  <input
                    type="text"
                    placeholder="Search job title, location or company..."
                    value={adminJobSearch}
                    onChange={(e) => setAdminJobSearch(e.target.value)}
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', flex: 1, minWidth: '180px' }}
                  />
                  <select
                    value={adminJobStatusFilter}
                    onChange={(e) => setAdminJobStatusFilter(e.target.value)}
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', width: 'auto' }}
                  >
                    <option value="all">All Postings ({adminJobs.length})</option>
                    <option value="open">Live / Open</option>
                    <option value="draft">Hidden / Draft</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--shadow-md)', overflowX: 'auto' }}>
                {filteredAdminJobs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>No job listings match the moderation criteria.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Job ID</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Position Details</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Company</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Compensation</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Created</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdminJobs.map((job) => (
                        <tr key={job.job_id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            #{job.job_id}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{job.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {job.location || 'Remote'} • {job.employment_type?.replace('_', ' ')}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{job.company?.name || `Company #${job.company_id}`}</span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                            ${(job.salary_min || 0).toLocaleString()} - ${(job.salary_max || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            {job.status === 'open' ? (
                              <span className="badge" style={{ background: 'rgba(0, 230, 165, 0.12)', color: 'var(--primary)', border: '1px solid var(--border-emerald)' }}>
                                🟢 Live / Open
                              </span>
                            ) : job.status === 'draft' ? (
                              <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#EAB308', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                                🟡 Hidden / Draft
                              </span>
                            ) : (
                              <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
                                ⚪ Closed
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                            {new Date(job.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              {job.status === 'open' ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateJobStatus(job.job_id, 'draft')}
                                    className="btn btn-outline"
                                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderColor: '#EAB308', color: '#EAB308' }}
                                    title="Hide job from candidate search without deleting"
                                  >
                                    Hide
                                  </button>
                                  <button
                                    onClick={() => handleUpdateJobStatus(job.job_id, 'closed')}
                                    className="btn btn-outline"
                                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderColor: '#94A3B8', color: '#94A3B8' }}
                                  >
                                    Close
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleUpdateJobStatus(job.job_id, 'open')}
                                  className="btn btn-outline"
                                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderColor: 'var(--border-emerald)', color: 'var(--primary)' }}
                                >
                                  Publish
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteJobAdmin(job.job_id, job.title)}
                                className="btn btn-outline"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#EF4444' }}
                                title="Permanently delete job post and cancel applications"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: COMPANY PROFILE MANAGER ================= */}
          {adminTab === 'companies' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#F8FAFC', margin: 0 }}>
                    🏢 Company Profile Manager & Verification
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Inspect corporate documentation, approve verified badges, edit details, or remove fake/duplicate profiles.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, maxWidth: '520px', justifyContent: 'flex-end' }}>
                  <input
                    type="text"
                    placeholder="Search company name, location, or tax ID..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', flex: 1, minWidth: '180px' }}
                  />
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', width: 'auto' }}
                  >
                    <option value="all">All Companies ({companies.length})</option>
                    <option value="verified">Verified Only</option>
                    <option value="pending">Pending Verification</option>
                  </select>
                </div>
              </div>

              {filteredCompanies.length === 0 ? (
                <div style={{ background: 'var(--surface-card)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No companies match the search or filter criteria.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {filteredCompanies.map((comp) => (
                    <div
                      key={comp.company_id || comp.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        padding: '1.35rem 1.5rem',
                        border: comp.is_verified ? '1px solid var(--border-emerald)' : '1px solid rgba(234, 179, 8, 0.4)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-card)',
                        gap: '1.25rem',
                        flexWrap: 'wrap',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                          <h4 style={{ color: 'var(--primary)', fontSize: '1.25rem', margin: 0 }}>{comp.name}</h4>
                          <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>ID #{comp.company_id || comp.id}</span>
                          {comp.is_verified ? (
                            <span className="badge" style={{ background: 'rgba(0, 230, 165, 0.15)', color: 'var(--primary)', border: '1px solid var(--border-emerald)' }}>
                              ✓ Verified Organization
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#EAB308', border: '1px solid rgba(234, 179, 8, 0.4)' }}>
                              ⏳ Pending Review
                            </span>
                          )}
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                          📍 Location: <strong>{comp.location || 'N/A'}</strong> {comp.website && <>• 🌐 <a href={comp.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{comp.website}</a></>}
                        </p>

                        {/* Audit Verification Metadata Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', background: 'var(--surface-elevated)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '0.75rem' }}>
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
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                            "{comp.description}"
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'center', minWidth: '180px' }}>
                        <button
                          onClick={() => handleToggleCompanyVerification(comp.company_id || comp.id, comp.is_verified)}
                          className={`btn ${comp.is_verified ? 'btn-outline' : 'btn-emerald'}`}
                          style={{ padding: '0.55rem 1.15rem', fontSize: '0.825rem', width: '100%' }}
                        >
                          {comp.is_verified ? 'Revoke Verification' : '✓ Approve & Verify'}
                        </button>
                        <button
                          onClick={() => setEditingCompany(comp)}
                          className="btn btn-outline"
                          style={{ padding: '0.55rem 1.15rem', fontSize: '0.825rem', width: '100%' }}
                        >
                          ✏️ Edit Profile Details
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(comp.company_id || comp.id, comp.name)}
                          className="btn btn-outline"
                          style={{ padding: '0.55rem 1.15rem', fontSize: '0.825rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#EF4444', width: '100%' }}
                        >
                          🗑️ Delete Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: SKILLS TAXONOMY MANAGER ================= */}
          {adminTab === 'skills' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#F8FAFC', margin: 0 }}>
                    🏷️ Skills & Categories Master Data Management
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Curate platform skills tagged on job descriptions and candidate profiles. Correct typos or clean up duplicates.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '320px' }}>
                  <input
                    type="text"
                    placeholder="Search existing skills..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', width: '100%' }}
                  />
                </div>
              </div>

              {/* Add New Skill Form */}
              <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: 'var(--primary)' }}>
                  + Add Predefined Skill to Taxonomy
                </h4>
                <form onSubmit={handleCreateSkill} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kubernetes, TypeScript, PyTorch, GraphQL..."
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    style={{ flex: 1, minWidth: '220px', padding: '0.65rem 1rem', background: 'var(--surface-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: '#FFF' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontSize: '0.875rem' }}>
                    + Add Skill
                  </button>
                </form>
              </div>

              {/* Skills Table */}
              <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--shadow-md)' }}>
                {filteredSkills.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>No skills found matching search.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem 1rem', width: '100px' }}>Skill ID</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Standard Skill Name</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSkills.map((s) => (
                        <tr key={s.skill_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            #{s.skill_id}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            {editingSkillId === s.skill_id ? (
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  value={editingSkillName}
                                  onChange={(e) => setEditingSkillName(e.target.value)}
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', background: 'var(--surface-elevated)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', color: '#FFF' }}
                                />
                                <button
                                  onClick={() => handleUpdateSkill(s.skill_id)}
                                  className="btn btn-primary"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingSkillId(null)}
                                  className="btn btn-outline"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.name}</span>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            {editingSkillId !== s.skill_id && (
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => {
                                    setEditingSkillId(s.skill_id);
                                    setEditingSkillName(s.name);
                                  }}
                                  className="btn btn-outline"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}
                                >
                                  Rename / Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSkill(s.skill_id, s.name)}
                                  className="btn btn-outline"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#EF4444' }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 5: USER GOVERNANCE ================= */}
          {adminTab === 'users' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.35rem', color: '#F8FAFC', margin: 0 }}>
                    👥 User Governance & Role Management
                  </h3>
                  <span className="badge badge-accent" style={{ fontSize: '0.8rem' }}>
                    {usersList.length} Registered Users
                  </span>
                </div>

                {/* Controls: Search and Filter */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, maxWidth: '520px', justifyContent: 'flex-end' }}>
                  <input
                    type="text"
                    placeholder="Search user by name, email or ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', flex: 1, minWidth: '180px' }}
                  />
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', width: 'auto' }}
                  >
                    <option value="all">All Users</option>
                    <option value="active">Active Accounts Only</option>
                    <option value="suspended">Suspended Accounts Only</option>
                    <option value="admin">Admins Only</option>
                    <option value="regular">Standard Users Only</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-emerald)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--shadow-md)', overflowX: 'auto' }}>
                {filteredUsers.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '1rem' }}>No users match the search/filter criteria.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>User ID</th>
                        <th style={{ padding: '0.75rem 1rem' }}>User Details</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Account Status</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Joined Date</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s', opacity: u.deleted_at ? 0.75 : 1 }}>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            #{u.user_id}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            {u.is_admin ? (
                              <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#EAB308', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                                👑 Administrator
                              </span>
                            ) : (
                              <span className="badge" style={{ background: 'rgba(0, 230, 165, 0.12)', color: 'var(--primary)', border: '1px solid var(--border-emerald)' }}>
                                👤 Standard User
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            {u.deleted_at ? (
                              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }} title={`Suspended on: ${new Date(u.deleted_at).toLocaleString()}`}>
                                🔴 Suspended ({new Date(u.deleted_at).toLocaleDateString()})
                              </span>
                            ) : (
                              <span className="badge" style={{ background: 'rgba(0, 230, 165, 0.12)', color: 'var(--primary)', border: '1px solid var(--border-emerald)' }}>
                                🟢 Active
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleToggleAdmin(u.user_id, u.is_admin)}
                                disabled={u.user_id === user?.user_id || !!u.deleted_at}
                                className="btn btn-outline"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', opacity: (u.user_id === user?.user_id || u.deleted_at) ? 0.4 : 1 }}
                                title={u.user_id === user?.user_id ? "You cannot modify your own admin role" : u.deleted_at ? "Reactivate user before modifying role" : ""}
                              >
                                {u.is_admin ? 'Demote to User' : 'Promote to Admin'}
                              </button>
                              {u.deleted_at ? (
                                <button
                                  onClick={() => handleRestoreUser(u.user_id, u.name)}
                                  className="btn btn-outline"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', borderColor: 'var(--border-emerald)', color: 'var(--primary)' }}
                                >
                                  Reactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDeleteUser(u.user_id, u.name)}
                                  disabled={u.user_id === user?.user_id}
                                  className="btn btn-outline"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#EF4444', opacity: u.user_id === user?.user_id ? 0.4 : 1 }}
                                  title={u.user_id === user?.user_id ? "You cannot delete your own account" : ""}
                                >
                                  Suspend
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
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

      {editingCompany && (
        <CompanyEditModal
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
          onSuccess={() => {
            setActionMessage('Company profile updated successfully!');
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
