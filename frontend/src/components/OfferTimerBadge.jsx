import React from 'react';

export const OfferTimerBadge = ({ expiresAt }) => {
  return (
    <div className="offer-timer-badge">
      <span>Expires: {expiresAt ? new Date(expiresAt).toLocaleDateString() : 'N/A'}</span>
    </div>
  );
};

export default OfferTimerBadge;
