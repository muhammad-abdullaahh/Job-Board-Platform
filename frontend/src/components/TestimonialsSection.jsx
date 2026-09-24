import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const REVIEWS_DATA = [
  // Candidate / Job Seeker Reviews
  {
    id: 1,
    type: 'candidate',
    name: 'Sarah Jenkins',
    role: 'Senior Frontend Engineer',
    company: 'Stripe',
    avatar: 'SJ',
    avatarBg: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    rating: 5,
    hireDuration: 'Hired in 5 Days',
    salaryBump: '+28% Salary Increase',
    quote: 'I applied on Job-Board on Monday, interviewed with the VP of Engineering on Wednesday, and had my formal offer by Friday. The direct connection to decision-makers without endless recruiter phone screens is revolutionary.',
    verified: true,
  },
  {
    id: 2,
    type: 'candidate',
    name: 'Marcus Chen',
    role: 'DevOps & Cloud Architect',
    company: 'Datadog Ecosystem',
    avatar: 'MC',
    avatarBg: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
    rating: 5,
    hireDuration: 'Hired in 11 Days',
    salaryBump: 'Remote • $165k/yr',
    quote: 'Every posting on this platform includes transparent salary bands and verified tech requirements. No guessing games or bait-and-switch offers. I found my current remote dream role in under two weeks.',
    verified: true,
  },
  {
    id: 3,
    type: 'candidate',
    name: 'Elena Rostova',
    role: 'Lead Product Designer',
    company: 'Fintech Studio',
    avatar: 'ER',
    avatarBg: 'linear-gradient(135deg, #EC4899, #F43F5E)',
    rating: 5,
    hireDuration: 'Hired in 8 Days',
    salaryBump: 'Full-Time Relocation',
    quote: 'The real-time status tracker was a game-changer. I could see when my resume was reviewed, when an interview was scheduled, and when my offer was generated. Zero ghosting.',
    verified: true,
  },

  // Employer / Company Reviews
  {
    id: 4,
    type: 'employer',
    name: 'David Miller',
    role: 'VP of Engineering',
    company: 'FinTech Dynamics',
    avatar: 'FD',
    avatarBg: 'linear-gradient(135deg, #10B981, #059669)',
    rating: 5,
    hireDuration: 'Filled 4 Engineering Roles',
    salaryBump: 'Average 9-day cycle',
    quote: 'Job-Board cut our hiring cycle in half. Candidate profiles are pre-validated with real skills and portfolios. We made two senior hires within 10 days of listing our open backend positions.',
    verified: true,
  },
  {
    id: 5,
    type: 'employer',
    name: 'Amina Patel',
    role: 'Head of Talent Acquisition',
    company: 'CloudScale AI',
    avatar: 'CA',
    avatarBg: 'linear-gradient(135deg, #F59E0B, #D97706)',
    rating: 5,
    hireDuration: 'Hired 7 Specialists',
    salaryBump: '98% Candidate Retention',
    quote: 'The applicant management tools and direct candidate communication in our employer dashboard eliminated our reliance on expensive external headhunters. The quality of applicants here is unmatched.',
    verified: true,
  },
  {
    id: 6,
    type: 'employer',
    name: 'Robert Hayes',
    role: 'Co-Founder & CEO',
    company: 'NextWave Labs',
    avatar: 'NW',
    avatarBg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    rating: 5,
    hireDuration: 'Founding Team Hires',
    salaryBump: 'Seed-Stage Scaling',
    quote: 'As a rapidly growing startup, we needed talented engineers who could ship on day one. Job-Board delivered motivated, high-caliber developers who fit our product culture immediately.',
    verified: true,
  }
];

export const TestimonialsSection = () => {
  const [activeTab, setActiveTab] = useState('all');

  const filteredReviews = activeTab === 'all'
    ? REVIEWS_DATA
    : REVIEWS_DATA.filter((r) => r.type === activeTab);

  return (
    <section className="testimonials-section">
      <div className="testimonials-header">
        <div className="testimonials-pill">
          <span>🌟 REAL SUCCESS STORIES</span>
        </div>
        <h2>Trusted by Candidates & Top Companies Alike</h2>
        <p>
          Discover how ambitious professionals landed their dream jobs and high-growth companies built stellar teams using Job-Board.
        </p>

        {/* Category Tab Filter */}
        <div className="testimonials-tabs">
          <button
            className={`testimonial-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            🌟 All Stories ({REVIEWS_DATA.length})
          </button>
          <button
            className={`testimonial-tab-btn ${activeTab === 'candidate' ? 'active' : ''}`}
            onClick={() => setActiveTab('candidate')}
          >
            🎯 Placed Candidates (3)
          </button>
          <button
            className={`testimonial-tab-btn ${activeTab === 'employer' ? 'active' : ''}`}
            onClick={() => setActiveTab('employer')}
          >
            🏢 Hiring Companies (3)
          </button>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="testimonials-grid">
        {filteredReviews.map((review) => (
          <div key={review.id} className="testimonial-card">
            <div className="testimonial-card-top">
              <div className="testimonial-stars" aria-label={`${review.rating} out of 5 stars`}>
                {'★'.repeat(review.rating)}
              </div>
              <span className={`testimonial-badge badge-${review.type}`}>
                {review.type === 'candidate' ? '🎯 Candidate Hired' : '🏢 Verified Employer'}
              </span>
            </div>

            <p className="testimonial-quote">
              &ldquo;{review.quote}&rdquo;
            </p>

            <div className="testimonial-metrics">
              <span className="testimonial-metric-pill">⏱️ {review.hireDuration}</span>
              <span className="testimonial-metric-pill">💎 {review.salaryBump}</span>
            </div>

            <div className="testimonial-author">
              <div className="testimonial-avatar" style={{ background: review.avatarBg }}>
                {review.avatar}
              </div>
              <div className="testimonial-details">
                <div className="author-name-row">
                  <span className="author-name">{review.name}</span>
                  {review.verified && <span className="verified-check" title="Verified Review">✓</span>}
                </div>
                <div className="author-role">{review.role}</div>
                <div className="author-company">@ {review.company}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Trust & Impact Bar */}
      <div className="testimonials-trust-bar">
        <div className="trust-item">
          <div className="trust-val">4.9 / 5.0</div>
          <div className="trust-label">⭐⭐⭐⭐⭐ Average User Rating</div>
        </div>
        <div className="trust-divider" />
        <div className="trust-item">
          <div className="trust-val">94%</div>
          <div className="trust-label">Candidate Placement Rate</div>
        </div>
        <div className="trust-divider" />
        <div className="trust-item">
          <div className="trust-val">&lt; 48 Hours</div>
          <div className="trust-label">Guaranteed Employer Response</div>
        </div>
      </div>

      {/* Bottom Conversion Prompt */}
      <div className="testimonials-cta-card">
        <div className="cta-text">
          <h3>Ready to Write Your Own Success Story?</h3>
          <p>Join over 15,000+ candidates and 500+ verified employers today.</p>
        </div>
        <div className="cta-buttons">
          <Link to="/register" className="btn btn-emerald" style={{ padding: '0.75rem 1.65rem' }}>
            Get Started Free &rarr;
          </Link>
          <Link to="/jobs" className="btn btn-outline" style={{ padding: '0.75rem 1.4rem' }}>
            Browse All Jobs
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
