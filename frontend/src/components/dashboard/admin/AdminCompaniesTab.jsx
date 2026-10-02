import React from 'react';

export const AdminCompaniesTab = ({
  companies,
  companySearch,
  setCompanySearch,
  companyFilter,
  setCompanyFilter,
  filteredCompanies,
  onToggleCompanyVerification,
  onEditCompany,
  onDeleteCompany,
}) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', color: '#F8FAFC', margin: 0 }}>
            🏢 Company Profile Manager & Verification
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Inspect corporate documentation, approve verified badges, edit details, or remove fake/duplicate profiles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, maxWidth: '520px', justifyContent: 'flex-end' }}>
          <input
            type="text"
            placeholder="Search company name, location, or tax ID..."
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', flex: 1, minWidth: '180px' }}
          />
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', width: 'auto' }}
          >
            <option value="all">All Companies ({companies.length})</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Verification</option>
          </select>
        </div>
      </div>

      {filteredCompanies.length === 0 ? (
        <div style={{ background: 'var(--surface-card)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No companies match the search or filter criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredCompanies.map((comp) => (
            <div
              key={comp.company_id || comp.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '1.35rem 1.5rem',
                border: comp.is_verified ? '1px solid var(--border-emerald)' : '1px solid rgba(234, 179, 8, 0.4)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-card)',
                gap: '1.25rem',
                flexWrap: 'wrap',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ flex: 1, minWidth: 'min(100%, 280px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <h4 style={{ color: 'var(--primary)', fontSize: '1.25rem', margin: 0 }}>{comp.name}</h4>
                  {comp.is_verified ? (
                    <span className="badge" style={{ background: 'rgba(0, 230, 165, 0.15)', color: 'var(--primary)', border: '1px solid var(--border-emerald)' }}>
                      ✓ Verified Organization
                    </span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#EAB308', border: '1px solid rgba(234, 179, 8, 0.4)' }}>
                      ⏳ Pending Review
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  📍 Location: <strong>{comp.location || 'N/A'}</strong> {comp.website && <>• 🌐 <a href={comp.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{comp.website}</a></>}
                </p>

                {/* Audit Verification Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.65rem', background: 'var(--surface-elevated)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    👥 <strong>Company Size:</strong> {comp.employee_count || 'Not Specified'}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    📧 <strong>HR Email:</strong> {comp.hr_contact_email ? <a href={`mailto:${comp.hr_contact_email}`} style={{ color: 'var(--primary)' }}>{comp.hr_contact_email}</a> : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    🔗 <strong>CRO/Executive LinkedIn:</strong> {comp.cro_linkedin ? <a href={comp.cro_linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>View Profile &rarr;</a> : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    📑 <strong>Registration/Tax ID:</strong> {comp.registration_number || 'N/A'}
                  </div>
                </div>

                {comp.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                    "{comp.description}"
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'center', minWidth: 'min(100%, 180px)' }}>
                <button
                  onClick={() => onToggleCompanyVerification(comp.company_id || comp.id, comp.is_verified)}
                  className={`btn ${comp.is_verified ? 'btn-outline' : 'btn-emerald'}`}
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.825rem', width: '100%' }}
                >
                  {comp.is_verified ? 'Revoke Verification' : '✓ Approve & Verify'}
                </button>
                <button
                  onClick={() => onEditCompany(comp)}
                  className="btn btn-outline"
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.825rem', width: '100%' }}
                >
                  ✏️ Edit Profile Details
                </button>
                <button
                  onClick={() => onDeleteCompany(comp.company_id || comp.id, comp.name)}
                  className="btn btn-outline"
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.825rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#EF4444', width: '100%' }}
                >
                  🗑️ Delete Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
