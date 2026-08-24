import React from 'react';

const statusConfig = {
  pending: { label: 'Pending', className: 'badge-pending' },
  reviewed: { label: 'Reviewed', className: 'badge-reviewed' },
  shortlisted: { label: 'Shortlisted', className: 'badge-shortlisted' },
  offer_issued: { label: 'Offer Issued', className: 'badge-offer' },
  offer_accepted: { label: 'Offer Accepted', className: 'badge-success' },
  offer_declined: { label: 'Offer Declined', className: 'badge-danger' },
  hired: { label: 'Hired 🎉', className: 'badge-success' },
  rejected: { label: 'Rejected', className: 'badge-danger' },
  expired: { label: 'Expired ⏰', className: 'badge-expired' },
  open: { label: 'Open', className: 'badge-success' },
  closed: { label: 'Closed', className: 'badge-danger' },
  draft: { label: 'Draft', className: 'badge-pending' },
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { label: status, className: 'badge-default' };

  return (
    <span className={`badge ${config.className}`}>
      {config.label}
    </span>
  );
};
