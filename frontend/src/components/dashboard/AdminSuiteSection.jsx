import React from 'react';
import { AdminAnalyticsTab } from './admin/AdminAnalyticsTab';
import { AdminJobsTab } from './admin/AdminJobsTab';
import { AdminCompaniesTab } from './admin/AdminCompaniesTab';
import { AdminSkillsTab } from './admin/AdminSkillsTab';
import { AdminUsersTab } from './admin/AdminUsersTab';

export const AdminSuiteSection = ({
  adminTab,
  setAdminTab,
  analytics,
  adminJobs,
  adminJobSearch,
  setAdminJobSearch,
  adminJobStatusFilter,
  setAdminJobStatusFilter,
  filteredAdminJobs,
  onUpdateJobStatus,
  onDeleteJobAdmin,
  companies,
  companySearch,
  setCompanySearch,
  companyFilter,
  setCompanyFilter,
  filteredCompanies,
  onToggleCompanyVerification,
  onEditCompany,
  onDeleteCompany,
  skillSearch,
  setSkillSearch,
  newSkillName,
  setNewSkillName,
  editingSkillId,
  setEditingSkillId,
  editingSkillName,
  setEditingSkillName,
  filteredSkills,
  onCreateSkill,
  onUpdateSkill,
  onDeleteSkill,
  currentUser,
  usersList,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  filteredUsers,
  onToggleAdmin,
  onDeleteUser,
  onRestoreUser,
}) => {
  return (
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
      <div className="dashboard-tabs" style={{ borderBottom: '1px solid var(--border-light)' }}>
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
          🏷️ Skills Taxonomy ({filteredSkills.length})
        </button>
        <button
          onClick={() => setAdminTab('users')}
          className={`btn ${adminTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          👥 User Governance ({usersList.length})
        </button>
      </div>

      {/* Tab Panels */}
      {adminTab === 'analytics' && (
        <AdminAnalyticsTab analytics={analytics} />
      )}

      {adminTab === 'jobs' && (
        <AdminJobsTab
          adminJobs={adminJobs}
          adminJobSearch={adminJobSearch}
          setAdminJobSearch={setAdminJobSearch}
          adminJobStatusFilter={adminJobStatusFilter}
          setAdminJobStatusFilter={setAdminJobStatusFilter}
          filteredAdminJobs={filteredAdminJobs}
          onUpdateJobStatus={onUpdateJobStatus}
          onDeleteJobAdmin={onDeleteJobAdmin}
        />
      )}

      {adminTab === 'companies' && (
        <AdminCompaniesTab
          companies={companies}
          companySearch={companySearch}
          setCompanySearch={setCompanySearch}
          companyFilter={companyFilter}
          setCompanyFilter={setCompanyFilter}
          filteredCompanies={filteredCompanies}
          onToggleCompanyVerification={onToggleCompanyVerification}
          onEditCompany={onEditCompany}
          onDeleteCompany={onDeleteCompany}
        />
      )}

      {adminTab === 'skills' && (
        <AdminSkillsTab
          skillSearch={skillSearch}
          setSkillSearch={setSkillSearch}
          newSkillName={newSkillName}
          setNewSkillName={setNewSkillName}
          editingSkillId={editingSkillId}
          setEditingSkillId={setEditingSkillId}
          editingSkillName={editingSkillName}
          setEditingSkillName={setEditingSkillName}
          filteredSkills={filteredSkills}
          onCreateSkill={onCreateSkill}
          onUpdateSkill={onUpdateSkill}
          onDeleteSkill={onDeleteSkill}
        />
      )}

      {adminTab === 'users' && (
        <AdminUsersTab
          currentUser={currentUser}
          usersList={usersList}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          userRoleFilter={userRoleFilter}
          setUserRoleFilter={setUserRoleFilter}
          filteredUsers={filteredUsers}
          onToggleAdmin={onToggleAdmin}
          onDeleteUser={onDeleteUser}
          onRestoreUser={onRestoreUser}
        />
      )}
    </section>
  );
};
