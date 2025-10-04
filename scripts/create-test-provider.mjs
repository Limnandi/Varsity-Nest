import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is not set.")
  process.exit(1)
}

const sql = neon(databaseUrl)

async function createTestProvider() {
  try {
    console.log("🏢 Creating test provider account...")

    // Create user account for provider
    const hashedPassword = await bcrypt.hash("TempPassword123!", 12)
    const userEmail = "test@provider.com"

    console.log(`Creating provider user: ${userEmail}`)

    const userResult = await sql`
      INSERT INTO users (email, password, first_name, last_name, role, phone, is_active, email_verified)
      VALUES (
        ${userEmail}, 
        ${hashedPassword}, 
        'Test', 
        'Provider', 
        'provider', 
        '+27 51 401 1234', 
        true, 
        true
      )
      ON CONFLICT (email) DO UPDATE SET
        phone = '+27 51 401 1234',
        updated_at = NOW()
      RETURNING id
    `

    const userId = userResult[0].id
    console.log(`User created with ID: ${userId}`)

    // Create provider record
    console.log(`Creating provider record...`)

    const providerResult = await sql`
      INSERT INTO providers (
        user_id, business_name, contact_person, contact_email, contact_phone, address,
        description, registration_status, is_active
      )
      VALUES (
        ${userId}, 
        'Test Provider Ltd', 
        'Test Provider', 
        ${userEmail}, 
        '+27 51 401 1234', 
        '123 Test Street, Bloemfontein, 9300',
        'Test accommodation provider for development', 
        'approved', 
        true
      )
      RETURNING id
    `

    const providerId = providerResult[0].id
    console.log(`Provider created with ID: ${providerId}`)

    // Create accommodation
    console.log(`Creating test accommodation...`)

    await sql`
      INSERT INTO accommodations (
        provider_id, name, description, address, price, accreditation_status,
        amenities, is_active
      )
      VALUES (
        ${providerId},
        'Test Student Residence',
        'Modern student accommodation for testing purposes',
        '123 Test Street, Bloemfontein, 9300',
        3500.00,
        'accredited',
        '["WiFi", "Security", "Laundry", "Study Areas", "Parking"]'::jsonb,
        true
      )
      ON CONFLICT DO NOTHING
    `

    console.log("✅ Test provider account created successfully!")
    console.log("")
    console.log("Provider login credentials:")
    console.log(`   Email: ${userEmail}`)
    console.log("   Password: TempPassword123!")
    console.log("")
    console.log("You can now login to the provider dashboard!")

  } catch (error) {
    console.error("Error creating test provider:", error)
    process.exit(1)
  }
}

createTestProvider()
