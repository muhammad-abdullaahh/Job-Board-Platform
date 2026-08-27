import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { fetchMyApplicationsApi } from '../api/applicationsApi';
import { fetchCompaniesApi } from '../api/companiesApi';
import { verifyCompanyApi } from '../api/adminApi';
import { StatusBadge } from '../components/StatusBadge';
import { CompanyRegisterModal } from '../components/CompanyRegisterModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [myCompany, setMyCompany] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load candidate applications
      const appsData = await fetchMyApplicationsApi().catch(() => []);
      setApplications(appsData || []);

      // Load companies
      const compsData = await fetchCompaniesApi().catch(() => []);
      setCompanies(compsData || []);

      // Find company owned by logged in user
      if (user && user.user_id) {
        const found = compsData.find((c) => c.owner_user_id === user.user_id);
        setMyCompany(found || null);
      }
    } catch (err) {
      console.error(err);
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
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to verify company.');
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

      {actionMessage && <div className="success-banner">{actionMessage}</div>}

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
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{myCompany.industry || 'Industry Not Specified'} • {myCompany.location || 'Location Not Specified'}</p>
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

            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {myCompany.description || 'No description provided.'}
            </p>

            {myCompany.is_verified ? (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#065F46', fontWeight: 600 }}>Your company is verified! You can now post jobs and manage candidate applications.</span>
                <a href="/jobs" className="btn btn-primary">Post a New Job &rarr;</a>
              </div>
            ) : (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', color: '#92400E' }}>
                💡 <strong>Approval Pending:</strong> Your company registration is currently under review by an administrator. Once approved, job posting capabilities will be enabled for your account.
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
          <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B91C1C' }}>
            👑 Admin Verification Panel (Manage Companies)
          </h2>
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-md)' }}>
            {companies.filter(c => !c.is_verified).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>All registered companies are currently verified.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {companies.filter(c => !c.is_verified).map((comp) => (
                  <div key={comp.company_id || comp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: '#FAF5FF' }}>
                    <div>
                      <h4 style={{ color: 'var(--primary)' }}>{comp.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{comp.industry || 'N/A'} • Owner ID: {comp.owner_user_id}</p>
                    </div>
                    <button onClick={() => handleVerifyCompany(comp.company_id || comp.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      ✓ Approve & Verify Company
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- MY APPLICATIONS SECTION --- */}
      <section className="dashboard-section">
        <h2 style={{ marginBottom: '1.25rem' }}>My Candidate Applications</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading applications...</p>
        ) : applications.length === 0 ? (
          <div style={{ background: 'var(--surface-card)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No applications submitted yet. Browse jobs to submit your first application!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {applications.map((app) => (
              <div key={app.application_id || app.id} style={{ background: 'var(--surface-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{app.job_title || 'Position'}</h3>
                  <StatusBadge status={app.status} />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Applied on: {new Date(app.created_at || Date.now()).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Company Registration Modal */}
      {showCompanyModal && (
        <CompanyRegisterModal
          onClose={() => setShowCompanyModal(false)}
          onSuccess={() => {
            setActionMessage('Company submitted! It is currently pending administrator verification.');
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
