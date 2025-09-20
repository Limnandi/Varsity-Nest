import { getSQL } from "../lib/database"
import bcrypt from "bcryptjs"
import fs from "fs"

function mapAccreditationStatus(status: string): string {
  // Map CSV values to valid database values
  const statusMap: Record<string, string> = {
    "ACCREDITED": "accredited",
    "PROVISIONALLY ACCREDITED": "provisionally_accredited",
    "NON-ACCREDITED": "non_accredited",
    "non-accredited": "non_accredited"
  }
  return statusMap[status.toUpperCase()] || "non_accredited"
}
import path from "path"
import csv from "csv-parser"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

// --- Configuration ---
const __dirname = path.resolve()
// Force load .env.local first to ensure variables are available
const envPath = path.join(process.cwd(), ".env.local")
const result = dotenv.config({ path: envPath })
if (result.error) {
  console.error("Failed to load .env.local:", result.error)
  process.exit(1)
}
console.log("Loaded environment variables from:", envPath)

const { ADMIN_INITIAL_PASSWORD } = process.env
const UFS_ACCREDITED_PROVIDERS_CSV = path.join(process.cwd(), "data", "ufs-accredited-providers.csv")

if (!ADMIN_INITIAL_PASSWORD) {
  console.error("FATAL: ADMIN_INITIAL_PASSWORD environment variable is not set.")
  process.exit(1)
}

async function seedAdmin() {
  console.log("   - Seeding admin user...")
  const hashedPassword: string = await bcrypt.hash(ADMIN_INITIAL_PASSWORD as string, 10)
  const sql = getSQL()
  await sql`
    INSERT INTO users (first_name, last_name, email, password, role, created_at)
    VALUES (${"Admin"}, ${"User"}, ${"admin@varsitynest.space"}, ${hashedPassword}, ${"admin"}, ${new Date()})
    ON CONFLICT (email) DO UPDATE
    SET password = ${hashedPassword}
  `;
  console.log("   ✅ Admin user seeded.")
}

async function seedProvidersFromCSV() {
  console.log("   - Seeding providers from CSV...")
  if (!fs.existsSync(UFS_ACCREDITED_PROVIDERS_CSV)) {
    throw new Error(`CSV file not found at ${UFS_ACCREDITED_PROVIDERS_CSV}`)
  }

  const results: any[] = await new Promise((resolve, reject) => {
    const data: any[] = []
    fs.createReadStream(UFS_ACCREDITED_PROVIDERS_CSV)
      .pipe(csv())
      .on("data", (row) => data.push(row))
      .on("end", () => resolve(data))
      .on("error", (error) => reject(error))
  })

  let seededCount = 0
  for (const provider of results) {
    const providerName = provider["PROPERTY NAME / EIENDOM NAAM"] || "Unknown Provider"
    const contactPerson = provider["CONTACT PERSON"] || "N/A"
    const email = provider["E-MAIL"] || `provider-${Date.now()}@varsitynest.space`

    // Create a user for the provider
    const hashedPassword = await bcrypt.hash("provider123", 10)
    const sql = getSQL();
    const [newUser] = await sql`
      INSERT INTO users
        (first_name, last_name, email, password, role)
      VALUES
        (${contactPerson.split(' ')[0] || 'Provider'},
         ${contactPerson.split(' ')[1] || 'User'},
         ${email},
         ${hashedPassword},
         ${"provider"})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    if (newUser) {
      const [newProvider] = await sql`
        INSERT INTO providers
          (user_id, business_name, contact_person, contact_email, contact_phone, address)
        VALUES
          (${newUser.id},
           ${providerName},
           ${contactPerson},
           ${email},
           ${provider["CONTACT NUMBER"] || "0000000000"},
           ${provider["PHYSICAL ADDRESS"] || "No address provided"})
        RETURNING id
      `;

      await sql`
        INSERT INTO accommodations
          (provider_id, name, address, accreditation_status, price, description, images, amenities, room_types)
        VALUES
          (${newProvider.id},
            ${providerName},
            ${provider["PHYSICAL ADDRESS"] || "N/A"},
            ${mapAccreditationStatus(provider["ACCREDITATION STATUS"] || "non_accredited")},
            ${String(Math.floor(Math.random() * (5000 - 2500 + 1)) + 2500)},
            ${`Accredited accommodation provided by ${providerName}.`},
            '[\"/placeholder.svg?height=400&width=600\"]',
            '[\"wifi\", \"laundry\", \"parking\"]',
            '[\"shared-room\"]')
      `;
      seededCount++
    }
  }
  console.log(`   ✅ Seeded ${seededCount} new providers and accommodations.`)
}

async function main() {
  try {
    console.log("\n🌱 Starting database setup...")
    // Note: This script assumes tables are created by a separate migration step.
    // For simplicity in this context, we'll focus on seeding.
    await seedAdmin()
    await seedProvidersFromCSV()
    console.log("\n🎉 Database seeding completed successfully!")
  } catch (error) {
    console.error("\n❌ An error occurred during database setup:", error)
    process.exit(1)
  }
}

main()

