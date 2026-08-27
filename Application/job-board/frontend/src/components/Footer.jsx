import React from 'react';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} JobBoard Platform — Empowering Top Careers & Talent.</p>
      </div>
    </footer>
  );
};

export default Footer;
