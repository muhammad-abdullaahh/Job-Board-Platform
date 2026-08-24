import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const OfferTimerBadge = ({ offerExpiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!offerExpiresAt) return;

    const calculateTime = () => {
      const target = new Date(offerExpiresAt).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [offerExpiresAt]);

  if (isExpired) {
    return (
      <span className="badge badge-expired" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        <Clock size={14} /> Offer Expired
      </span>
    );
  }

  return (
    <span className="badge badge-offer-timer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      <Clock size={14} className="pulse-icon" /> Expires in: <strong>{timeLeft}</strong>
    </span>
  );
};
