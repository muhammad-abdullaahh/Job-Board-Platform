import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

export const ApplicationModal = ({ job, onClose, onSubmit, loading, error }) => {
  const [coverLetter, setCoverLetter] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!coverLetter.trim()) return;
    onSubmit(job.job_id, coverLetter);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Apply for {job.title}</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{job.company?.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-muted)', border: 'none' }}>
            <X size={24} />
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Cover Letter / Pitch</label>
            <textarea
              className="form-control"
              rows={6}
              placeholder="Introduce yourself and explain why you're a great fit for this position..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Send size={16} /> {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
