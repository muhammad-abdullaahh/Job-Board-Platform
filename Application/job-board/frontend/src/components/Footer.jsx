import React from 'react';
import { Briefcase } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{ borderTop: '1px solid var(--border-color)', padding: '2.5rem 0', background: 'var(--bg-dark)', marginTop: '4rem', color: 'var(--text-subtle)', textAlign: 'center', fontSize: '0.9rem' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: '#fff' }}>
          <Briefcase size={20} color="#6366f1" />
          <span>CareerHub Platform</span>
        </div>
        <p>© 2026 Job Board Platform. All rights reserved.</p>
      </div>
    </footer>
  );
};
