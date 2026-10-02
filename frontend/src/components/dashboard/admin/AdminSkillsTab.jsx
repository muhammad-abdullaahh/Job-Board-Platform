import React from 'react';

export const AdminSkillsTab = ({
  skillSearch,
  setSkillSearch,
  newSkillName,
  setNewSkillName,
  editingSkillId,
  setEditingSkillId,
  editingSkillName,
  setEditingSkillName,
  filteredSkills,
  onCreateSkill,
  onUpdateSkill,
  onDeleteSkill,
}) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', color: '#F8FAFC', margin: 0 }}>
            🏷️ Skills & Categories Master Data Management
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Curate platform skills tagged on job descriptions and candidate profiles. Correct typos or clean up duplicates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '320px' }}>
          <input
            type="text"
            placeholder="Search existing skills..."
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', width: '100%' }}
          />
        </div>
      </div>

      {/* Add New Skill Form */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: 'var(--primary)' }}>
          + Add Predefined Skill to Taxonomy
        </h4>
        <form onSubmit={onCreateSkill} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            required
            placeholder="e.g. Kubernetes, TypeScript, PyTorch, GraphQL..."
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            style={{ flex: 1, minWidth: '220px', padding: '0.65rem 1rem', background: 'var(--surface-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: '#FFF' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontSize: '0.875rem' }}>
            + Add Skill
          </button>
        </form>
      </div>

      {/* Skills Table */}
      <div className="table-responsive">
        {filteredSkills.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>No skills found matching search.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Standard Skill Name</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSkills.map((s) => (
                <tr key={s.skill_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {editingSkillId === s.skill_id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={editingSkillName}
                          onChange={(e) => setEditingSkillName(e.target.value)}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', background: 'var(--surface-elevated)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', color: '#FFF' }}
                        />
                        <button
                          onClick={() => onUpdateSkill(s.skill_id)}
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSkillId(null)}
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.name}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    {editingSkillId !== s.skill_id && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditingSkillId(s.skill_id);
                            setEditingSkillName(s.name);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem' }}
                        >
                          Rename / Edit
                        </button>
                        <button
                          onClick={() => onDeleteSkill(s.skill_id, s.name)}
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#EF4444' }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
