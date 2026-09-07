import React from 'react';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        <img src="/logo-icon.png" alt="Job-Board Logo" style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }} />
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Job-Board — Tech Careers & Growth Platform.</p>
      </div>
    </footer>
  );
};

export default Footer;
