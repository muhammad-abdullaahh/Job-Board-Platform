import type { CollectionConfig } from 'payload'

export const Staff: CollectionConfig = {
  slug: 'staff',
  labels: {
    singular: 'Staff Member',
    plural: 'Staff Members',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 minutes
    tokenExpiration: 7200, // 2 hours
    verify: false, // Internal staff accounts do not require email verification
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles', 'createdAt', 'updatedAt'],
    group: 'System',
  },
  access: {
    // Public registration disabled: only an admin can create, update, or delete staff accounts
    create: ({ req: { user } }) => Boolean(user && (user as any).roles === 'admin'),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user && (user as any).roles === 'admin'),
    delete: ({ req: { user } }) => Boolean(user && (user as any).roles === 'admin'),
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      required: true,
      defaultValue: 'moderator',
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Moderator', value: 'moderator' },
      ],
      saveToJWT: true,
      access: {
        update: ({ req: { user } }) => Boolean(user && (user as any).roles === 'admin'),
      },
    },
  ],
}
