import { redirect } from "next/navigation"
import { getStackServerApp } from "@/lib/stack"

export const dynamic = 'force-dynamic'

export default async function AuthRedirectPage() {
  const app = getStackServerApp()
  const user = await app.getUser({ or: "redirect" })

  // Prefer server metadata, then client metadata
  const role = (user as any)?.serverMetadata?.role
    || (user as any)?.clientMetadata?.role
    || (user as any)?.clientReadOnlyMetadata?.role
    || inferAdminByEmail(user?.primaryEmail)
    || 'student'

  switch (role) {
    case 'admin':
      redirect('/admin/dashboard')
    case 'provider':
      redirect('/provider/dashboard')
    case 'student':
    default:
      redirect('/student/dashboard')
  }
}

function inferAdminByEmail(email?: string | null) {
  if (!email) return null
  const admins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return admins.includes(email.toLowerCase()) ? 'admin' : null
}


