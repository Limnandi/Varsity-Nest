const { neon } = require("@neondatabase/serverless")
const bcrypt = require("bcryptjs")

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is not set")
  process.exit(1)
}

const sql = neon(databaseUrl)

async function createAdminUser() {
  try {
    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_INITIAL_PASSWORD
    const name = process.env.ADMIN_NAME || "Admin User"

    if (!email || !password) {
      throw new Error("ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD must be set")
    }

    // First, let's check what columns actually exist in the users table
    console.log("Checking users table structure...")

    try {
      const tableInfo = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `

      console.log("Users table columns:", tableInfo)
    } catch (error) {
      console.log("Could not get table info, proceeding with basic columns...")
    }

    // Check if admin already exists
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`

    if (existingUser.length > 0) {
      console.log("Admin user already exists!")
      return
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create admin user with basic columns that should exist
    const result = await sql`
      INSERT INTO users (email, password_hash, name, role, is_active, is_verified, created_at)
      VALUES (${email}, ${passwordHash}, ${name}, 'admin', true, true, NOW())
      RETURNING id, email, name, role
    `

    console.log("Admin user created successfully:", result[0])
  } catch (error) {
    console.error("Error creating admin user:", error)
    console.error("Error details:", error.message)
  }
}

createAdminUser()
