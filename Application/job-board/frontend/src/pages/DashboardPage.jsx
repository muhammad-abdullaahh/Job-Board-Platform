import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { fetchMyApplicationsApi } from '../api/applicationsApi';
import { StatusBadge } from '../components/StatusBadge';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyApplicationsApi()
      .then((data) => {
        setApplications(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="page-container dashboard-page">
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name || user?.email} ({user?.role})</p>

      <section className="dashboard-section">
        <h2>My Applications</h2>
        {loading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <p>No applications submitted yet.</p>
        ) : (
          <div className="applications-list">
            {applications.map((app) => (
              <div key={app.application_id || app.id} className="application-item">
                <h3>{app.job_title || 'Job Title'}</h3>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
