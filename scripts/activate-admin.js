require('dotenv').config({ path: '.env.local' })
const { neon } = require("@neondatabase/serverless")

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is not set")
  process.exit(1)
}

const sql = neon(databaseUrl)

async function checkAndActivateAdmin() {
  try {
    // Check all admin users
    console.log("\n=== Checking Admin Users ===\n")
    const admins = await sql`
      SELECT id, email, role, is_active, first_name, last_name, created_at
      FROM users 
      WHERE role = 'admin'
    `

    if (admins.length === 0) {
      console.log(" No admin users found in database!")
      process.exit(1)
    }

    console.log(`Found ${admins.length} admin user(s):\n`)
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Email: ${admin.email}`)
      console.log(`   Name: ${admin.first_name} ${admin.last_name}`)
      console.log(`   Active: ${admin.is_active ? ' YES' : ' NO'}`)
      console.log(`   Created: ${admin.created_at}\n`)
    })

    // Activate all inactive admin users
    const inactiveAdmins = admins.filter(a => !a.is_active)
    
    if (inactiveAdmins.length === 0) {
      console.log(" All admin users are already active!")
      process.exit(0)
    }

    console.log(`\n🔧 Activating ${inactiveAdmins.length} inactive admin user(s)...\n`)
    
    for (const admin of inactiveAdmins) {
      await sql`
        UPDATE users 
        SET is_active = true
        WHERE id = ${admin.id}
      `
      console.log(` Activated: ${admin.email}`)
    }

    console.log("\n All admin users are now active!")
    console.log("You can now log in to the admin dashboard.\n")
    
  } catch (error) {
    console.error(" Error:", error.message)
    process.exit(1)
  }
}

checkAndActivateAdmin()

