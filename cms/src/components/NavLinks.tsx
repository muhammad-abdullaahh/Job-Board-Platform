'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const NavLinks: React.FC = () => {
  const pathname = usePathname()

  const links = [
    { label: 'Platform Overview', href: '/admin', icon: '📊' },
    { label: 'Companies Moderation', href: '/admin/companies', icon: '🏢' },
    { label: 'Jobs Moderation', href: '/admin/jobs', icon: '💼' },
    { label: 'Applications Review', href: '/admin/applications', icon: '📄' },
    { label: 'User Lifecycle', href: '/admin/users', icon: '👥' },
    { label: 'System Audit Logs', href: '/admin/audit-logs', icon: '📜' },
  ]

  return (
    <div className="cms-nav-group">
      <div className="cms-nav-title">Job Board Platform</div>
      {links.map((link) => {
        const isActive = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`cms-nav-item ${isActive ? 'active' : ''}`}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export default NavLinks
