import { redirect } from "next/navigation"
import { getStackServerApp } from "@/lib/stack"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export default async function AuthRedirectPage() {
  const app = getStackServerApp()
  const user = await app.getUser({ or: "redirect" })

  if (!user?.id) {
    redirect('/auth/login')
  }

  // Get role from database instead of StackAuth metadata
  let role = 'student' // default fallback

  try {
    const userResult = await query`
      SELECT role FROM users WHERE id = ${user.id}
    `
    
    if (userResult.rows.length > 0) {
      role = userResult.rows[0].role
    } else {
      // Fallback to email-based admin detection if user not found in DB
      role = inferAdminByEmail(user?.primaryEmail) || 'student'
    }
  } catch (error) {
    console.error('Error fetching user role:', error)
    // Fallback to email-based admin detection
    role = inferAdminByEmail(user?.primaryEmail) || 'student'
  }

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


