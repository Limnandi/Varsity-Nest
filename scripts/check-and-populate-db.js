const { neon } = require("@neondatabase/serverless")
const fs = require("fs")
const path = require("path")
const csv = require("csv-parser")

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set")
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function query(text, params = []) {
  try {
    console.log("Executing query:", text.substring(0, 100) + "...")
    const result = await sql(text, params)
    console.log("Query executed successfully")
    return { rows: Array.isArray(result) ? result : [result] }
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

async function tableExists(tableName) {
  try {
    const result = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName],
    )
    return result.rows[0].exists
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

async function getTableRowCount(tableName) {
  try {
    const result = await query(`SELECT COUNT(*) as count FROM ${tableName}`)
    return Number.parseInt(result.rows[0].count)
  } catch (error) {
    console.error(`Error getting row count for table ${tableName}:`, error)
    return 0
  }
}

async function createTables() {
  console.log("Creating database tables...")

  const schemaPath = path.join(__dirname, "..", "database", "schema.sql")

  if (!fs.existsSync(schemaPath)) {
    console.error("Schema file not found:", schemaPath)
    return false
  }

  const schema = fs.readFileSync(schemaPath, "utf8")

  try {
    await query(schema)
    console.log("Database tables created successfully")
    return true
  } catch (error) {
    console.error("Error creating tables:", error)
    return false
  }
}

async function seedData() {
  console.log("Seeding database with initial data...")

  try {
    // Create admin user if it doesn't exist
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD
    if (!adminPassword) {
      throw new Error("ADMIN_INITIAL_PASSWORD is required for seeding")
    }
    const bcrypt = require("bcryptjs")
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    await query(
      `INSERT INTO users (id, email, password, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      ["admin-001", "admin@varsitynest.space", hashedPassword, "System", "Administrator", "admin", true, true],
    )

    console.log("Admin user created/verified")

    // Seed accommodations from CSV
    await seedAccommodationsFromCSV()

    console.log("Database seeded successfully")
    return true
  } catch (error) {
    console.error("Error seeding data:", error)
    return false
  }
}

async function seedAccommodationsFromCSV() {
  const csvPath = path.join(__dirname, "..", "data", "ufs-accredited-providers.csv")

  if (!fs.existsSync(csvPath)) {
    console.log("CSV file not found, skipping accommodation seeding")
    return
  }

  return new Promise((resolve, reject) => {
    const accommodations = []

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        accommodations.push(row)
      })
      .on("end", async () => {
        console.log(`Processing ${accommodations.length} accommodations from CSV...`)

        for (const acc of accommodations) {
          try {
            await query(
              `INSERT INTO accommodations (
                id, name, description, address, price, images, amenities, 
                accreditation_status, provider_id, contact_email, contact_phone,
                website_url, is_active, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
              ON CONFLICT (id) DO NOTHING`,
              [
                `acc-${Date.now()}-${Math.random().toString(36).substring(2)}`,
                acc.name || "Unnamed Accommodation",
                acc.description || "No description available",
                acc.address || "Address not provided",
                Number.parseFloat(acc.price) || 0,
                JSON.stringify(["/placeholder.svg?height=300&width=400"]),
                JSON.stringify(acc.amenities ? acc.amenities.split(",") : []),
                "accredited",
                "provider-001",
                acc.contact_email || null,
                acc.contact_phone || null,
                acc.website_url || null,
                true,
              ],
            )
          } catch (error) {
            console.error("Error inserting accommodation:", error)
          }
        }

        console.log("Accommodations seeded from CSV")
        resolve()
      })
      .on("error", reject)
  })
}

async function main() {
  console.log("🚀 Starting database setup...")

  try {
    // Test connection
    console.log("🔌 Testing database connection...")
    await query("SELECT NOW() as current_time")
    console.log("✅ Database connection successful")

    // Check if tables exist
    const tablesExist = await tableExists("users")

    if (!tablesExist) {
      console.log("📋 Tables don't exist, creating them...")
      const created = await createTables()
      if (!created) {
        console.error("❌ Failed to create tables")
        process.exit(1)
      }
    } else {
      console.log("✅ Tables already exist")
    }

    // Check if data exists
    const userCount = await getTableRowCount("users")
    const accommodationCount = await getTableRowCount("accommodations")

    console.log(`📊 Current data: ${userCount} users, ${accommodationCount} accommodations`)

    if (userCount === 0 || accommodationCount === 0) {
      console.log("🌱 Seeding initial data...")
      await seedData()
    } else {
      console.log("✅ Database already has data")
    }

    console.log("🎉 Database setup completed successfully!")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    process.exit(1)
  }
}

main()
