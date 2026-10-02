import React from 'react';

export const AdminAnalyticsTab = ({ analytics }) => {
  if (!analytics) return null;

  return (
    <div>
      {/* KPI Metric Cards Grid */}
      <div className="kpi-grid">
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
            {analytics.users.suspended > 0 && ` • 🔴 ${analytics.users.suspended} Suspended`}
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
      <div className="breakdown-grid">
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
  );
};
