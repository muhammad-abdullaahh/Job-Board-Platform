import React from 'react';

export const AdminUsersTab = ({
  currentUser,
  usersList,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  filteredUsers,
  onToggleAdmin,
  onDeleteUser,
  onRestoreUser,
}) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.35rem', color: '#F8FAFC', margin: 0 }}>
            👥 User Governance & Role Management
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge badge-accent" style={{ fontSize: '0.8rem' }}>
              {usersList.length} Total Users
            </span>
            <span className="badge" style={{ background: 'rgba(0, 230, 165, 0.12)', color: 'var(--primary)', border: '1px solid var(--border-emerald)', fontSize: '0.75rem' }}>
              🟢 {usersList.filter(u => !u.deleted_at).length} Active
            </span>
            {usersList.some(u => !!u.deleted_at) && (
              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.75rem' }}>
                🔴 {usersList.filter(u => !!u.deleted_at).length} Suspended
              </span>
            )}
          </div>
        </div>

        {/* Controls: Search and Filter */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, maxWidth: '100%', justifyContent: 'flex-end' }}>
          <input
            type="text"
            placeholder="Search user by name or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', flex: '1 1 200px', minWidth: '180px' }}
          />
          <select
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', color: '#FFF', border: '1px solid var(--border-light)', flex: '0 1 180px', width: 'auto' }}
          >
            <option value="all">All Users ({usersList.length})</option>
            <option value="active">Active Accounts ({usersList.filter(u => !u.deleted_at).length})</option>
            <option value="suspended">Suspended Accounts ({usersList.filter(u => !!u.deleted_at).length})</option>
            <option value="admin">Admins Only ({usersList.filter(u => u.is_admin).length})</option>
            <option value="regular">Standard Users ({usersList.filter(u => !u.is_admin).length})</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        {filteredUsers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem' }}>No users match the search/filter criteria.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>User Details</th>
                <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                <th style={{ padding: '0.75rem 1rem' }}>Account Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Joined Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s', opacity: u.deleted_at ? 0.75 : 1 }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {u.is_admin ? (
                      <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#EAB308', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                        👑 Administrator
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(0, 230, 165, 0.12)', color: 'var(--primary)', border: '1px solid var(--border-emerald)' }}>
                        👤 Standard User
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {u.deleted_at ? (
                      <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }} title={`Suspended on: ${new Date(u.deleted_at).toLocaleString()}`}>
                        🔴 Suspended ({new Date(u.deleted_at).toLocaleDateString()})
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(0, 230, 165, 0.12)', color: 'var(--primary)', border: '1px solid var(--border-emerald)' }}>
                        🟢 Active
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => onToggleAdmin(u.user_id, u.is_admin)}
                        disabled={u.user_id === currentUser?.user_id || !!u.deleted_at}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', opacity: (u.user_id === currentUser?.user_id || u.deleted_at) ? 0.4 : 1 }}
                        title={u.user_id === currentUser?.user_id ? "You cannot modify your own admin role" : u.deleted_at ? "Reactivate user before modifying role" : ""}
                      >
                        {u.is_admin ? 'Demote to User' : 'Promote to Admin'}
                      </button>
                      {u.deleted_at ? (
                        <button
                          onClick={() => onRestoreUser(u.user_id, u.name)}
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', borderColor: 'var(--border-emerald)', color: 'var(--primary)' }}
                          title="Reactivate user account and restore platform access"
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => onDeleteUser(u.user_id, u.name)}
                          disabled={u.user_id === currentUser?.user_id}
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#EF4444', opacity: u.user_id === currentUser?.user_id ? 0.4 : 1 }}
                          title={u.user_id === currentUser?.user_id ? "You cannot suspend your own administrator account" : "Suspend user account and associated listings"}
                        >
                          Suspend
                        </button>
                      )}
                    </div>
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
