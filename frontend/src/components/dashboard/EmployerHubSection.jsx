import React from 'react';
import { StatusBadge } from '../StatusBadge';

export const EmployerHubSection = ({
  myCompany,
  myJobs,
  activeJobId,
  selectedJobApps,
  onEditCompany,
  onPostJobClick,
  onRegisterCompanyClick,
  onEditJob,
  onDeleteJob,
  onFetchApplicationsForJob,
  onStatusChange,
}) => {
  return (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => onEditCompany(myCompany)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}
              >
                ✏️ Edit Profile
              </button>
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
              <button onClick={onPostJobClick} className="btn btn-emerald">
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => onEditJob(job)}
                            className="btn btn-outline"
                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                          >
                            ✏️ Edit Job
                          </button>
                          <button
                            onClick={() => onDeleteJob(job.job_id)}
                            className="btn btn-danger"
                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                          >
                            🗑️ Delete
                          </button>
                          <button
                            onClick={() => onFetchApplicationsForJob(job.job_id)}
                            className="btn btn-outline"
                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
                          >
                            {activeJobId === job.job_id ? 'Hide Applications' : 'View Received Applications'}
                          </button>
                        </div>
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
                                    <strong style={{ color: 'var(--text-main)' }}>{applicantApp.applicant?.name || applicantApp.applicant?.email || 'Candidate Applicant'}</strong>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>
                                      {applicantApp.cover_letter}
                                    </p>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <StatusBadge status={applicantApp.status} />
                                    <select
                                      value={applicantApp.status}
                                      onChange={(e) => onStatusChange(applicantApp.application_id, e.target.value, job.job_id)}
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
          <button onClick={onRegisterCompanyClick} className="btn btn-primary">
            + Register Your Company Now
          </button>
        </div>
      )}
    </section>
  );
};
