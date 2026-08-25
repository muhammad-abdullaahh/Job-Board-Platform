import React from 'react';

export const StatusBadge = ({ status }) => {
  return (
    <span className={`status-badge status-${status?.toLowerCase() || 'default'}`}>
      {status || 'Pending'}
    </span>
  );
};

export default StatusBadge;
