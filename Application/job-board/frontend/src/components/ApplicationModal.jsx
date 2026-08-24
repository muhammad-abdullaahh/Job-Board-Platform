import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { applyToJobApi } from '../api/applicationsApi';

export const ApplicationModal = ({ job, onClose, onSuccess }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!job) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverLetter.trim()) {
      setError('Please provide a cover letter explaining why you are a good fit.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await applyToJobApi(job.job_id, coverLetter);
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Failed to submit application. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Apply for {job.title}</h2>
            <p className="subtitle">{job.company?.name || 'Company'}</p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="coverLetter">Cover Letter / Pitch</label>
            <textarea
              id="coverLetter"
              rows={6}
              className="form-control"
              placeholder="Introduce yourself, highlight your skills, and explain why you're excited about this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
              <Send size={16} style={{ marginLeft: '0.5rem' }} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
