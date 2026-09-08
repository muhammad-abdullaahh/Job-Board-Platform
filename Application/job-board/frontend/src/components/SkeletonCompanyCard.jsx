import React from 'react';

export const SkeletonCompanyCard = () => {
  return (
    <div className="skeleton-card" style={{ minHeight: '280px' }}>
      <div>
        {/* Header: Company Name & Verification Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
          <span className="skeleton-box" style={{ width: '55%', height: '22px', borderRadius: '6px' }} />
          <span className="skeleton-box" style={{ width: '80px', height: '22px', borderRadius: 'var(--radius-pill)' }} />
        </div>

        {/* Location & Website info lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <span className="skeleton-box" style={{ width: '45%', height: '14px', borderRadius: '4px' }} />
          <span className="skeleton-box" style={{ width: '60%', height: '14px', borderRadius: '4px' }} />
        </div>

        {/* Description Lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.75rem' }}>
          <span className="skeleton-box" style={{ width: '95%', height: '13px', borderRadius: '4px' }} />
          <span className="skeleton-box" style={{ width: '75%', height: '13px', borderRadius: '4px' }} />
        </div>
      </div>

      {/* Footer: View Profile Button */}
      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
        <span className="skeleton-box" style={{ width: '100%', height: '40px', borderRadius: 'var(--radius-md)' }} />
      </div>
    </div>
  );
};

export const SkeletonCompanyGrid = ({ count = 6, showLiveIndicator = true }) => {
  return (
    <div>
      {showLiveIndicator && (
        <div className="live-sync-indicator">
          <span className="live-dot" />
          <span>Syncing verified employer registry from Supabase...</span>
        </div>
      )}
      <div className="companies-grid">
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCompanyCard key={index} />
        ))}
      </div>
    </div>
  );
};

export default SkeletonCompanyCard;
