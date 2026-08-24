import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeClass = (s) => {
    switch (s?.toLowerCase()) {
      case 'pending': return 'badge badge-pending';
      case 'reviewed': return 'badge badge-reviewed';
      case 'shortlisted': return 'badge badge-shortlisted';
      case 'accepted': return 'badge badge-accepted';
      case 'rejected': return 'badge badge-rejected';
      default: return 'badge badge-pending';
    }
  };

  return <span className={getBadgeClass(status)}>{status}</span>;
};
