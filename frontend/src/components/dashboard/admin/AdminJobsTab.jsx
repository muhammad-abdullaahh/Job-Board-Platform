import React from 'react';

export const AdminJobsTab = ({
  adminJobs,
  adminJobSearch,
  setAdminJobSearch,
  adminJobStatusFilter,
  setAdminJobStatusFilter,
  filteredAdminJobs,
  onUpdateJobStatus,
  onDeleteJobAdmin,
}) => {
  return (
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

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, maxWidth: '100%', justifyContent: 'flex-end' }}>
          <input
            type="text"
            placeholder="Search job title, location or company..."
            value={adminJobSearch}
            onChange={(e) => setAdminJobSearch(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', flex: '1 1 200px', minWidth: '180px' }}
          />
          <select
            value={adminJobStatusFilter}
            onChange={(e) => setAdminJobStatusFilter(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', flex: '0 1 160px', width: 'auto' }}
          >
            <option value="all">All Postings ({adminJobs.length})</option>
            <option value="open">Live / Open</option>
            <option value="draft">Hidden / Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        {filteredAdminJobs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>No job listings match the moderation criteria.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
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
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{job.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {job.location || 'Remote'} • {job.employment_type?.replace('_', ' ')}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{job.company?.name || 'Partner Company'}</span>
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
                            onClick={() => onUpdateJobStatus(job.job_id, 'draft')}
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderColor: '#EAB308', color: '#EAB308' }}
                            title="Hide job from candidate search without deleting"
                          >
                            Hide
                          </button>
                          <button
                            onClick={() => onUpdateJobStatus(job.job_id, 'closed')}
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderColor: '#94A3B8', color: '#94A3B8' }}
                          >
                            Close
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onUpdateJobStatus(job.job_id, 'open')}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderColor: 'var(--border-emerald)', color: 'var(--primary)' }}
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteJobAdmin(job.job_id, job.title)}
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
  );
};
