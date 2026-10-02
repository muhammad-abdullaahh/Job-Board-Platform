import React from 'react';
import { StatusBadge } from '../StatusBadge';
import { OfferTimerBadge } from '../OfferTimerBadge';

export const CandidateApplicationsSection = ({
  applications,
  loading,
  onStatusChange,
}) => {
  return (
    <section className="dashboard-section">
      <h2 style={{ marginBottom: '1.25rem' }}>My Candidate Applications</h2>
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading applications...</p>
      ) : applications.length === 0 ? (
        <div style={{ background: 'var(--surface-card)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No applications submitted yet. Browse jobs to submit your first application!</p>
        </div>
      ) : (
        <div className="jobs-grid">
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
                      onClick={() => onStatusChange(app.application_id, 'offer_accepted')}
                      className="btn btn-emerald"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.85rem' }}
                    >
                      Accept Offer
                    </button>
                    <button
                      onClick={() => onStatusChange(app.application_id, 'offer_declined')}
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
  );
};
