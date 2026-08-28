import React, { useState, useEffect } from 'react';
import { createJobApi } from '../api/jobsApi';
import { fetchSkillsApi } from '../api/skillsApi';

export const JobCreateModal = ({ companyId, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState(50000);
  const [salaryMax, setSalaryMax] = useState(100000);
  const [employmentType, setEmploymentType] = useState('full_time');
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSkillsApi()
      .then((skills) => setAvailableSkills(skills || []))
      .catch(() => setAvailableSkills([]));
  }, []);

  const handleSkillToggle = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter((id) => id !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createJobApi({
        company_id: companyId,
        title,
        description,
        location,
        salary_min: Number(salaryMin),
        salary_max: Number(salaryMax),
        employment_type: employmentType,
        skill_ids: selectedSkills,
      });
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create job posting.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <h2>Post a New Opportunity</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          Create a new job listing for your organization.
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.85rem' }}>Job Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.85rem' }}>Employment Type</label>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                <option value="full_time">Full-Time</option>
                <option value="part_time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="remote">Remote</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.85rem' }}>Location / Remote</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA or Remote"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.85rem' }}>Minimum Salary ($)</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="50000"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.85rem' }}>Maximum Salary ($)</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="120000"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.85rem' }}>Job Description *</label>
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the job duties, qualifications, and benefits..."
              required
            />
          </div>

          {availableSkills.length > 0 && (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>Required Skills</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                {availableSkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill.skill_id);
                  return (
                    <button
                      key={skill.skill_id}
                      type="button"
                      onClick={() => handleSkillToggle(skill.skill_id)}
                      className={`badge ${isSelected ? 'badge-primary' : 'badge-accent'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {isSelected ? '✓ ' : '+ '}{skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Publishing...' : 'Publish Job Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobCreateModal;
