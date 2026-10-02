import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { fetchMyApplicationsApi, fetchJobApplicationsApi, updateApplicationStatusApi } from '../api/applicationsApi';
import { fetchUserProfileApi, updateUserProfileApi } from '../api/usersApi';
import { fetchCompaniesApi, fetchMyCompanyApi, deleteCompanyApi } from '../api/companiesApi';
import { fetchJobsApi, deleteJobApi } from '../api/jobsApi';
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
import { CompanyRegisterModal } from '../components/CompanyRegisterModal';
import { CompanyEditModal } from '../components/CompanyEditModal';
import { JobCreateModal } from '../components/JobCreateModal';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { LoadingThrobber } from '../components/LoadingThrobber';
import { getErrorMessage } from '../errors/errorMessages';

// Extracted Modular Dashboard Subcomponents
import { CandidateProfileSection } from '../components/dashboard/CandidateProfileSection';
import { EmployerHubSection } from '../components/dashboard/EmployerHubSection';
import { AdminSuiteSection } from '../components/dashboard/AdminSuiteSection';
import { CandidateApplicationsSection } from '../components/dashboard/CandidateApplicationsSection';

export const DashboardPage = () => {
  const { user, setUser, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
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
  const [editingJob, setEditingJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  const loadDashboardData = async (isInitial = false) => {
    // Only show full-page loading throbber on initial mount if data has not yet been loaded
    if (isInitial || (!companies.length && !applications.length)) {
      setLoading(true);
    }
    try {
      const isUserAdmin = user && (user.is_admin || user.role === 'admin');

      // 1. Fetch all independent resources simultaneously in parallel
      const [
        appsData,
        compsData,
        profileData,
        allSkills,
        myCompData,
        adminResults
      ] = await Promise.all([
        fetchMyApplicationsApi().catch(() => []),
        fetchCompaniesApi().catch(() => []),
        fetchUserProfileApi().catch(() => null),
        fetchSkillsApi().catch(() => []),
        (user && user.user_id) ? fetchMyCompanyApi().catch(() => null) : Promise.resolve(null),
        isUserAdmin ? Promise.all([
          fetchUsersApi().catch(() => []),
          fetchAdminAnalyticsApi().catch(() => null),
          fetchAdminJobsApi().catch(() => []),
        ]) : Promise.resolve([[], null, []])
      ]);

      // 2. Set state immediately from concurrent responses
      setApplications(appsData || []);
      setCompanies(compsData || []);
      setSkillsList(allSkills || []);

      if (profileData) {
        setProfileForm({
          name: profileData.name || '',
          bio: profileData.bio || '',
          years_of_experience: profileData.years_of_experience || 0,
          skill_ids: (profileData.skills || []).map((s) => s.skill_id),
        });
      }

      if (isUserAdmin) {
        const [usersData, analyticsData, jobsData] = adminResults;
        setUsersList(usersData || []);
        setAnalytics(analyticsData);
        setAdminJobs(jobsData || []);
      }

      // 3. Resolve user's company and fetch associated jobs
      if (user && user.user_id) {
        let found = myCompData;
        if (!found && compsData && compsData.length) {
          found = compsData.find((c) => c.updated_by === user.user_id || c.created_by === user.user_id || c.owner_user_id === user.user_id);
        }
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
    if (user?.user_id) {
      loadDashboardData(true);
    }
  }, [user?.user_id]);

  const handleVerifyCompany = async (companyId) => {
    try {
      await verifyCompanyApi(companyId);
      setActionMessage('Company verified successfully!');
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to verify company.'));
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await deleteJobApi(jobId, myCompany?.company_id);
      setActionMessage('Job posting deleted successfully.');
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete job.'));
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
      alert(getErrorMessage(err, 'Failed to update status.'));
    }
  };

  const handleToggleAdmin = async (targetUserId, currentIsAdmin) => {
    try {
      await toggleUserAdminApi(targetUserId, !currentIsAdmin);
      setActionMessage(`User #${targetUserId} role updated to ${!currentIsAdmin ? 'Administrator' : 'Standard User'}`);
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to update user role.'));
    }
  };

  const handleDeleteUser = async (targetUserId, userName) => {
    if (!window.confirm(`Are you sure you want to suspend user "${userName || targetUserId}"? This will also soft-delete their companies, job listings, and applications.`)) return;
    try {
      await deleteUserApi(targetUserId);
      setActionMessage(`User #${targetUserId} suspended successfully.`);
      setUsersList((prev) =>
        prev.map((u) => (u.user_id === targetUserId ? { ...u, deleted_at: new Date().toISOString() } : u))
      );
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to suspend user.'));
    }
  };

  const handleRestoreUser = async (targetUserId, userName) => {
    try {
      await restoreUserApi(targetUserId);
      setActionMessage(`User #${targetUserId} (${userName || ''}) reactivated successfully.`);
      setUsersList((prev) =>
        prev.map((u) => (u.user_id === targetUserId ? { ...u, deleted_at: null } : u))
      );
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to reactivate user.'));
    }
  };

  const handleUpdateJobStatus = async (jobId, newStatus) => {
    try {
      await updateAdminJobStatusApi(jobId, newStatus);
      setActionMessage(`Job #${jobId} status updated to "${newStatus}".`);
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to update job status.'));
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
      alert(getErrorMessage(err, 'Failed to delete job.'));
    }
  };

  const handleToggleCompanyVerification = async (companyId, currentVerified) => {
    try {
      await toggleCompanyVerifyApi(companyId, !currentVerified);
      setActionMessage(`Company #${companyId} verification ${!currentVerified ? 'approved' : 'revoked'}.`);
      loadDashboardData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to update company verification.'));
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
      alert(getErrorMessage(err, 'Failed to delete company.'));
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
      alert(getErrorMessage(err, 'Failed to create skill.'));
    }
  };

  const handleUpdateSkill = async (skillId) => {
    if (!editingSkillName.trim()) return;
    try {
      await updateSkillApi(skillId, editingSkillName.trim());
      setActionMessage(`Skill "${editingSkillName.trim()}" updated successfully.`);
      setEditingSkillId(null);
      setEditingSkillName('');
      const updatedSkills = await fetchSkillsApi().catch(() => []);
      setSkillsList(updatedSkills || []);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to update skill.'));
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
      alert(getErrorMessage(err, 'Failed to delete skill.'));
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
      alert(getErrorMessage(err, 'Failed to save profile.'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAccountDeleted = async () => {
    setShowDeleteAccountModal(false);
    await logoutUser();
    navigate('/', { replace: true });
    alert('Your account has been deleted successfully.');
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

  if (loading) {
    return (
      <div className="page-container dashboard-page">
        <LoadingThrobber
          fullPage
          message="Loading"
          submessage="Preparing your dashboard, applications, and opportunities..."
        />
      </div>
    );
  }

  return (
    <div className="page-container dashboard-page">
      {/* Header Banner */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.25rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Welcome back, <strong style={{ color: 'var(--primary)' }}>{user?.name || user?.email}</strong> ({isAdmin ? 'System Administrator' : myCompany ? 'Employer' : 'Candidate'})
          </p>
        </div>
        {!myCompany && (
          <button onClick={() => setShowCompanyModal(true)} className="btn btn-emerald">
            🏢 Register a Company &rarr;
          </button>
        )}
      </div>

      {actionMessage && <div className="success-banner" style={{ marginBottom: '2rem' }}>{actionMessage}</div>}

      {/* 1. Candidate Profile & Platform Skills */}
      <CandidateProfileSection
        user={user}
        profileForm={profileForm}
        setProfileForm={setProfileForm}
        profileSaving={profileSaving}
        handleSaveProfile={handleSaveProfile}
        skillsList={skillsList}
        userSkillFilter={userSkillFilter}
        setUserSkillFilter={setUserSkillFilter}
        handleToggleProfileSkill={handleToggleProfileSkill}
        onDeleteAccountClick={() => setShowDeleteAccountModal(true)}
      />

      {/* 2. Company / Employer Hub Section */}
      <EmployerHubSection
        myCompany={myCompany}
        myJobs={myJobs}
        activeJobId={activeJobId}
        selectedJobApps={selectedJobApps}
        onEditCompany={(comp) => setEditingCompany(comp)}
        onPostJobClick={() => setShowJobModal(true)}
        onRegisterCompanyClick={() => setShowCompanyModal(true)}
        onEditJob={(job) => setEditingJob(job)}
        onDeleteJob={handleDeleteJob}
        onFetchApplicationsForJob={handleFetchApplicationsForJob}
        onStatusChange={handleStatusChange}
      />

      {/* 3. Administrator Command Suite (Admins only) */}
      {isAdmin && (
        <AdminSuiteSection
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          analytics={analytics}
          adminJobs={adminJobs}
          adminJobSearch={adminJobSearch}
          setAdminJobSearch={setAdminJobSearch}
          adminJobStatusFilter={adminJobStatusFilter}
          setAdminJobStatusFilter={setAdminJobStatusFilter}
          filteredAdminJobs={filteredAdminJobs}
          onUpdateJobStatus={handleUpdateJobStatus}
          onDeleteJobAdmin={handleDeleteJobAdmin}
          companies={companies}
          companySearch={companySearch}
          setCompanySearch={setCompanySearch}
          companyFilter={companyFilter}
          setCompanyFilter={setCompanyFilter}
          filteredCompanies={filteredCompanies}
          onToggleCompanyVerification={handleToggleCompanyVerification}
          onEditCompany={(comp) => setEditingCompany(comp)}
          onDeleteCompany={handleDeleteCompany}
          skillSearch={skillSearch}
          setSkillSearch={setSkillSearch}
          newSkillName={newSkillName}
          setNewSkillName={setNewSkillName}
          editingSkillId={editingSkillId}
          setEditingSkillId={setEditingSkillId}
          editingSkillName={editingSkillName}
          setEditingSkillName={setEditingSkillName}
          filteredSkills={filteredSkills}
          onCreateSkill={handleCreateSkill}
          onUpdateSkill={handleUpdateSkill}
          onDeleteSkill={handleDeleteSkill}
          currentUser={user}
          usersList={usersList}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          userRoleFilter={userRoleFilter}
          setUserRoleFilter={setUserRoleFilter}
          filteredUsers={filteredUsers}
          onToggleAdmin={handleToggleAdmin}
          onDeleteUser={handleDeleteUser}
          onRestoreUser={handleRestoreUser}
        />
      )}

      {/* 4. Candidate Applications Section */}
      <CandidateApplicationsSection
        applications={applications}
        loading={loading}
        onStatusChange={handleStatusChange}
      />

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

      {(showJobModal || editingJob) && myCompany && (
        <JobCreateModal
          companyId={myCompany.company_id}
          jobToEdit={editingJob}
          onClose={() => {
            setShowJobModal(false);
            setEditingJob(null);
          }}
          onSuccess={() => {
            setActionMessage(editingJob ? 'Job posting updated successfully!' : 'Job posting created successfully!');
            loadDashboardData();
            setShowJobModal(false);
            setEditingJob(null);
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

      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onAccountDeleted={handleAccountDeleted}
      />
    </div>
  );
};

export default DashboardPage;
