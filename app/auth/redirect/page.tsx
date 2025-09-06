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
  let roleSource = 'default'

  try {
    const userResult = await query`
      SELECT role FROM users WHERE id = ${user.id}
    `
    
    if (userResult.rows.length > 0) {
      role = userResult.rows[0].role
      roleSource = 'database'
      console.log(`User role retrieved from database: ${role} for user ${user.id}`)
    } else {
      // User not found in database - this indicates a webhook sync issue
      console.error(`CRITICAL: User ${user.id} not found in database! This indicates a webhook sync issue between StackAuth and our database.`)
      console.log(`User details:`, {
        id: user.id,
        email: user.primaryEmail,
        displayName: user.displayName
      })
      
      // Use email-based fallback for role detection
      role = inferAdminByEmail(user?.primaryEmail) || 'student'
      roleSource = 'email-fallback-user-not-found'
      console.log(`Using email-based role detection: ${role} for email ${user?.primaryEmail}`)
    }
  } catch (error) {
    console.error('Error fetching user role from database:', error)
    // Fallback to email-based admin detection
    role = inferAdminByEmail(user?.primaryEmail) || 'student'
    roleSource = 'error-fallback'
    console.log(`Using error fallback role detection: ${role} for email ${user?.primaryEmail}`)
  }

  // Log the final decision for debugging
  console.log(`Redirect decision: User ${user.id} (${user?.primaryEmail}) -> Role: ${role} (source: ${roleSource}) -> Dashboard: ${getDashboardPath(role)}`)

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

function getDashboardPath(role: string): string {
  switch (role) {
    case 'admin': return '/admin/dashboard'
    case 'provider': return '/provider/dashboard'
    case 'student': 
    default: return '/student/dashboard'
  }
}

function inferAdminByEmail(email?: string | null) {
  if (!email) {
    console.log('No email provided for admin inference')
    return null
  }
  
  const adminEmails = process.env.ADMIN_EMAILS || ''
  console.log(`Checking admin emails: "${adminEmails}" for email: ${email}`)
  
  if (!adminEmails) {
    console.log('ADMIN_EMAILS environment variable not set - cannot infer admin role')
    return null
  }
  
  const admins = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const isAdmin = admins.includes(email.toLowerCase())
  
  console.log(`Admin emails list: [${admins.join(', ')}]`)
  console.log(`Is ${email} admin? ${isAdmin}`)
  
  return isAdmin ? 'admin' : null
}



