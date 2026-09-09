import React from 'react';

/**
 * LoadingThrobber Component
 * Displays a modern animated dual-ring emerald throbber with 'Loading' text and animated bouncing dots.
 * Supports full-page, embedded, and custom sizing.
 */
export const LoadingThrobber = ({
  message = 'Loading',
  submessage = '',
  fullPage = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  inline = false,
  className = '',
}) => {
  const containerClasses = [
    'throbber-container',
    fullPage ? 'throbber-fullpage' : '',
    inline ? 'throbber-inline' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div className={`throbber-spinner throbber-${size}`}>
        <div className="throbber-ring-outer" />
        <div className="throbber-ring-inner" />
        <div className="throbber-core" />
      </div>
      <div className="throbber-text-wrap">
        <div className="throbber-message">
          <span>{message}</span>
          <span className="throbber-dots">
            <span className="throbber-dot">.</span>
            <span className="throbber-dot">.</span>
            <span className="throbber-dot">.</span>
          </span>
        </div>
        {submessage && <div className="throbber-submessage">{submessage}</div>}
      </div>
    </div>
  );
};

export default LoadingThrobber;
