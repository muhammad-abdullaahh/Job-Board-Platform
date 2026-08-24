import React from 'react';
import { Briefcase } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <Briefcase size={20} className="logo-icon" />
          <span>JobPulse</span>
          <p>© 2026 JobPulse Platform. Empowering careers & hiring globally.</p>
        </div>
        <div className="footer-links">
          <a href="/jobs">Browse Jobs</a>
          <a href="/login">Employer Portal</a>
          <a href="/privacy">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
};
