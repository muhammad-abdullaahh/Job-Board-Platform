import React from 'react';

export const SkeletonJobCard = () => {
  return (
    <div className="skeleton-card" style={{ minHeight: '320px' }}>
      <div>
        {/* Header: Title and Employment Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
          <span className="skeleton-box" style={{ width: '65%', height: '22px', borderRadius: '6px' }} />
          <span className="skeleton-box" style={{ width: '75px', height: '22px', borderRadius: 'var(--radius-pill)' }} />
        </div>

        {/* Company Name */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span className="skeleton-box" style={{ width: '38%', height: '16px', borderRadius: '4px' }} />
        </div>

        {/* Location & Salary Pills */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <span className="skeleton-box" style={{ width: '90px', height: '24px', borderRadius: 'var(--radius-pill)' }} />
          <span className="skeleton-box" style={{ width: '120px', height: '24px', borderRadius: 'var(--radius-pill)' }} />
        </div>

        {/* Skill Badges */}
        <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.5rem' }}>
          <span className="skeleton-box" style={{ width: '60px', height: '22px', borderRadius: '6px' }} />
          <span className="skeleton-box" style={{ width: '75px', height: '22px', borderRadius: '6px' }} />
          <span className="skeleton-box" style={{ width: '55px', height: '22px', borderRadius: '6px' }} />
        </div>

        {/* Description Lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.75rem' }}>
          <span className="skeleton-box" style={{ width: '95%', height: '13px', borderRadius: '4px' }} />
          <span className="skeleton-box" style={{ width: '80%', height: '13px', borderRadius: '4px' }} />
        </div>
      </div>

      {/* Footer: Stats & Action Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
        <span className="skeleton-box" style={{ width: '70px', height: '15px', borderRadius: '4px' }} />
        <span className="skeleton-box" style={{ width: '95px', height: '34px', borderRadius: 'var(--radius-md)' }} />
      </div>
    </div>
  );
};

export const SkeletonJobGrid = ({ count = 6, showLiveIndicator = true }) => {
  return (
    <div>
      {showLiveIndicator && (
        <div className="live-sync-indicator">
          <span className="live-dot" />
          <span>Syncing real-time opportunities from Supabase...</span>
        </div>
      )}
      <div className="jobs-grid">
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonJobCard key={index} />
        ))}
      </div>
    </div>
  );
};

export default SkeletonJobCard;
