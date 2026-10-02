import React from 'react';

export const CandidateProfileSection = ({
  user,
  profileForm,
  setProfileForm,
  profileSaving,
  handleSaveProfile,
  skillsList,
  userSkillFilter,
  setUserSkillFilter,
  handleToggleProfileSkill,
  onDeleteAccountClick,
}) => {
  return (
    <section className="dashboard-section" style={{ marginBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '1.6rem' }}>
            👤 My Profile & Candidate Skills
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Update your background and tag predefined skills set by platform administrators to increase matching with employers.
          </p>
        </div>
        <span className="badge" style={{ background: 'rgba(0, 230, 165, 0.12)', color: 'var(--primary)', border: '1px solid var(--border-emerald)' }}>
          {profileForm.skill_ids.length} Skills Attached
        </span>
      </div>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
        <form onSubmit={handleSaveProfile}>
          <div className="profile-grid">
            {/* Left Column: Basic Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-elevated)', border: '1px solid var(--border-light)', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Account Email (Verified)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Years of Professional Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={profileForm.years_of_experience}
                  onChange={(e) => setProfileForm({ ...profileForm, years_of_experience: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-elevated)', border: '1px solid var(--border-light)', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Professional Bio & Career Objective
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell employers about your engineering focus, key achievements, or passions..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-elevated)', border: '1px solid var(--border-light)', color: '#FFF', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Right Column: Predefined Skills Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                    🏷️ Platform Skills ({profileForm.skill_ids.length} selected)
                  </label>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.85rem 0' }}>
                  Choose from the curated platform taxonomy set by administrators. Click any skill to toggle it on your profile.
                </p>

                <input
                  type="text"
                  placeholder="Search predefined skills (e.g., Python, React)..."
                  value={userSkillFilter}
                  onChange={(e) => setUserSkillFilter(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.85rem', fontSize: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: '1px solid var(--border-light)', color: '#FFF', marginBottom: '1rem' }}
                />
              </div>

              {/* Selected Skills Chips */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Active On Your Profile:
                </div>
                {profileForm.skill_ids.length === 0 ? (
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                    No skills attached yet. Select from the available list below.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {profileForm.skill_ids.map((id) => {
                      const skillObj = skillsList.find((s) => s.skill_id === id);
                      const skillName = skillObj ? skillObj.name : 'Selected Skill';
                      return (
                        <span
                          key={id}
                          onClick={() => handleToggleProfileSkill(id)}
                          className="badge"
                          style={{
                            background: 'rgba(0, 230, 165, 0.2)',
                            color: 'var(--primary)',
                            border: '1px solid var(--border-emerald)',
                            padding: '0.35rem 0.65rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.825rem',
                            transition: 'transform 0.15s ease'
                          }}
                          title="Click to remove from profile"
                        >
                          <span>✓ {skillName}</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>✕</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Available Predefined Platform Skills */}
              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Available Platform Skills:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '220px', minHeight: '80px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingRight: '0.25rem' }}>
                  {skillsList
                    .filter((s) => s.name.toLowerCase().includes(userSkillFilter.toLowerCase()))
                    .map((s) => {
                      const isSelected = profileForm.skill_ids.includes(s.skill_id);
                      return (
                        <button
                          type="button"
                          key={s.skill_id}
                          onClick={() => handleToggleProfileSkill(s.skill_id)}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: 'var(--radius-pill)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                            background: isSelected ? 'var(--primary)' : 'var(--surface-card)',
                            color: isSelected ? 'var(--bg-main)' : 'var(--text-secondary)',
                            border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-light)'
                          }}
                        >
                          {isSelected ? `✓ ${s.name}` : `+ ${s.name}`}
                        </button>
                      );
                    })}
                  {skillsList.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      No predefined skills configured by administrators yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
            <button
              type="submit"
              disabled={profileSaving}
              className="btn btn-primary"
              style={{ padding: '0.75rem 2rem', fontSize: '0.95rem', minWidth: 'min(100%, 260px)' }}
            >
              {profileSaving ? 'Saving Profile...' : '💾 Save Profile & Skills'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Deletion / Danger Zone */}
      <div
        style={{
          marginTop: '1.25rem',
          background: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#EF4444', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚠️</span> Account Deletion & Deactivation
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Permanently deactivate your user profile, cascade-delete candidate applications, and revoke system access. Requires password confirmation.
          </p>
        </div>
        <button
          type="button"
          onClick={onDeleteAccountClick}
          style={{
            background: 'transparent',
            border: '1px solid #EF4444',
            color: '#EF4444',
            borderRadius: 'var(--radius-md)',
            padding: '0.55rem 1.15rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          🗑️ Delete Account
        </button>
      </div>
    </section>
  );
};
