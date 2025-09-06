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
      console.log(`✅ User role retrieved from database: ${role} for user ${user.id}`)
    } else {
      // User not found in database - this is a critical issue
      console.error(`❌ CRITICAL: User ${user.id} not found in database! This indicates a sync issue between StackAuth and our database.`)
      console.log(`User details:`, {
        id: user.id,
        email: user.primaryEmail,
        displayName: user.displayName
      })
      
      // Try to sync the user to database first
      try {
        await syncUserToDatabase(user)
        console.log(`🔄 Attempted to sync user ${user.id} to database`)
        
        // Retry the query after sync attempt
        const retryResult = await query`
          SELECT role FROM users WHERE id = ${user.id}
        `
        
        if (retryResult.rows.length > 0) {
          role = retryResult.rows[0].role
          roleSource = 'database-after-sync'
          console.log(`✅ User role retrieved after sync: ${role} for user ${user.id}`)
        } else {
          // Still not found, use email fallback
          role = inferAdminByEmail(user?.primaryEmail) || 'student'
          roleSource = 'email-fallback-after-sync-failed'
          console.log(`⚠️ Using email-based role detection after sync failed: ${role} for email ${user?.primaryEmail}`)
        }
      } catch (syncError) {
        console.error('❌ Failed to sync user to database:', syncError)
        // Fallback to email-based admin detection
        role = inferAdminByEmail(user?.primaryEmail) || 'student'
        roleSource = 'email-fallback-sync-error'
        console.log(`⚠️ Using email-based role detection after sync error: ${role} for email ${user?.primaryEmail}`)
      }
    }
  } catch (error) {
    console.error('❌ Error fetching user role from database:', error)
    // Fallback to email-based admin detection
    role = inferAdminByEmail(user?.primaryEmail) || 'student'
    roleSource = 'error-fallback'
    console.log(`⚠️ Using error fallback role detection: ${role} for email ${user?.primaryEmail}`)
  }

  // Log the final decision for debugging
  console.log(`🎯 Redirect decision: User ${user.id} (${user?.primaryEmail}) -> Role: ${role} (source: ${roleSource}) -> Dashboard: ${getDashboardPath(role)}`)

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
    console.log('⚠️ No email provided for admin inference')
    return null
  }
  
  const adminEmails = process.env.ADMIN_EMAILS || ''
  console.log(`🔍 Checking admin emails: "${adminEmails}" for email: ${email}`)
  
  if (!adminEmails) {
    console.log('⚠️ ADMIN_EMAILS environment variable not set - cannot infer admin role')
    return null
  }
  
  const admins = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const isAdmin = admins.includes(email.toLowerCase())
  
  console.log(`🔍 Admin emails list: [${admins.join(', ')}]`)
  console.log(`🔍 Is ${email} admin? ${isAdmin}`)
  
  return isAdmin ? 'admin' : null
}

async function syncUserToDatabase(user: any) {
  try {
    const email = user.primaryEmail
    if (!email) {
      throw new Error('No email available for user sync')
    }

    // Determine role based on email domain and admin emails
    let role = 'student' // default for student domains
    
    // Check if it's an admin email
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    if (adminEmails.includes(email.toLowerCase())) {
      role = 'admin'
    }
    // Check if it's a provider email (non-student domain)
    else if (!email.includes('@ufs4life.ac.za') && !email.includes('@cut.ac.za')) {
      role = 'provider'
    }
    // Student domains (@ufs4life.ac.za, @cut.ac.za) get 'student' role by default

    // Insert user into database
    await query`
      INSERT INTO users (id, email, first_name, last_name, role, email_verified, is_active, created_at, updated_at)
      VALUES (${user.id}, ${email}, ${user.displayName?.split(' ')[0] || ''}, ${user.displayName?.split(' ').slice(1).join(' ') || ''}, ${role}, true, true, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        updated_at = NOW()
    `
    
    console.log(`✅ User synced to database: ${user.id} (${email}) with role: ${role}`)
  } catch (error) {
    console.error('❌ Failed to sync user to database:', error)
    throw error
  }
}


