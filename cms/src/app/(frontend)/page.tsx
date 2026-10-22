import { redirect } from 'next/navigation'

/**
 * The CMS has NO public pages.
 * Redirects the root path '/' directly to the Payload Admin Panel '/admin'.
 */
export default function RootPage() {
  redirect('/admin')
}
