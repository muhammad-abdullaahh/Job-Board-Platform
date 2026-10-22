import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function createStaffUser(): Promise<void> {
  const email = process.env.STAFF_EMAIL?.trim()
  const password = process.env.STAFF_PASSWORD

  if (!email || !email.includes('@')) {
    console.error('❌ Error: STAFF_EMAIL must be a valid email address.')
    process.exit(1)
  }

  if (!password || password.length < 14) {
    console.error('❌ Error: STAFF_PASSWORD must be provided and must be at least 14 characters long.')
    // Never print the password
    process.exit(1)
  }

  console.log(`🚀 Initializing Payload Local API to bootstrap admin staff account (${email})...`)

  const payload = await getPayload({ config })

  try {
    const existing = await payload.find({
      collection: 'staff',
      where: {
        email: {
          equals: email.toLowerCase(),
        },
      },
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      const doc = existing.docs[0]
      console.log(`ℹ️ Staff user with email "${email}" already exists (ID: ${doc.id}). Updating to admin role if necessary...`)
      await payload.update({
        collection: 'staff',
        id: doc.id,
        data: {
          roles: 'admin',
          password, // updates password idempotently
        },
        overrideAccess: true,
      })
      console.log(`✅ Staff user "${email}" updated to admin role successfully.`)
    } else {
      await payload.create({
        collection: 'staff',
        data: {
          email: email.toLowerCase(),
          password,
          roles: 'admin',
        },
        overrideAccess: true,
      })
      console.log(`✅ Successfully created initial admin staff user: "${email}"`)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to create staff user:', error)
    process.exit(1)
  }
}

createStaffUser()
