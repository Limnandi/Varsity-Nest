import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import fs from "fs"
import path from "path"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is not set.")
  process.exit(1)
}

const sql = neon(databaseUrl)

// UFS Accredited Providers Data
const accreditedProviders = [
  {
    businessName: "Armentum Residence",
    address: "123 University Road, Bloemfontein",
    city: "Bloemfontein",
    province: "Free State",
    postalCode: "9300",
    phone: "+27 51 401 2345",
    email: "info@armentum.co.za",
    description: "Modern student accommodation with excellent facilities and 24/7 security",
    totalRooms: 150,
    pricePerMonth: 3500.0,
  },
  {
    businessName: "Kovsie Village",
    address: "456 Student Avenue, Bloemfontein",
    city: "Bloemfontein",
    province: "Free State",
    postalCode: "9301",
    phone: "+27 51 401 3456",
    email: "bookings@kovsievillage.co.za",
    description: "Premium student living with modern amenities and study facilities",
    totalRooms: 200,
    pricePerMonth: 4200.0,
  },
  {
    businessName: "Campus Lodge",
    address: "789 Academic Street, Bloemfontein",
    city: "Bloemfontein",
    province: "Free State",
    postalCode: "9302",
    phone: "+27 51 401 4567",
    email: "hello@campuslodge.co.za",
    description: "Affordable and comfortable student accommodation close to campus",
    totalRooms: 120,
    pricePerMonth: 2800.0,
  },
  {
    businessName: "Student Haven",
    address: "321 Education Drive, Bloemfontein",
    city: "Bloemfontein",
    province: "Free State",
    postalCode: "9303",
    phone: "+27 51 401 5678",
    email: "contact@studenthaven.co.za",
    description: "Safe and secure student accommodation with recreational facilities",
    totalRooms: 180,
    pricePerMonth: 3200.0,
  },
  {
    businessName: "University Heights",
    address: "654 Scholar Lane, Bloemfontein",
    city: "Bloemfontein",
    province: "Free State",
    postalCode: "9304",
    phone: "+27 51 401 6789",
    email: "info@universityheights.co.za",
    description: "Luxury student accommodation with private study rooms and gym facilities",
    totalRooms: 100,
    pricePerMonth: 4800.0,
  },
]

async function seedAccreditedProviders() {
  try {
    console.log("🏢 Starting accredited providers seeding...")

    // First, try to seed from CSV file if it exists
    const csvFilePath = path.join(process.cwd(), "data/ufs-accredited-providers.csv")
    if (fs.existsSync(csvFilePath)) {
      console.log("📄 Found CSV file, processing...")
      const csvContent = fs.readFileSync(csvFilePath, "utf-8")
      const lines = csvContent.split("\n")
      const headers = lines[0].split(",")

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const values = line.split(",")
        const serviceProvider = values[0]?.replace(/"/g, "")
        const address = values[1]?.replace(/"/g, "")
        const contact = values[2]?.replace(/"/g, "")
        const email = values[3]?.replace(/"/g, "")
        const capacity = values[4] ? Number.parseInt(values[4].replace(/"/g, "")) : null
        const cluster = values[5]?.replace(/"/g, "")

        if (serviceProvider && email) {
          await sql`
            INSERT INTO accredited_providers (service_provider, address, contact, email, capacity, cluster)
            VALUES (${serviceProvider}, ${address}, ${contact}, ${email}, ${capacity}, ${cluster})
            ON CONFLICT DO NOTHING
          `
        }
      }
    console.log("CSV data processed successfully")
    }

    // Seed hardcoded providers
    for (const providerData of accreditedProviders) {
      // Create user account for provider
      const hashedPassword = await bcrypt.hash("TempPassword123!", 12)
      const userEmail = providerData.email

      console.log(`Creating provider user: ${userEmail}`)

      const userResult = await sql`
        INSERT INTO users (email, password, first_name, last_name, role, phone, is_active, email_verified)
        VALUES (
          ${userEmail}, 
          ${hashedPassword}, 
          ${providerData.businessName.split(" ")[0]}, 
          'Provider', 
          'provider', 
          ${providerData.phone}, 
          true, 
          true
        )
        ON CONFLICT (email) DO UPDATE SET
          phone = ${providerData.phone},
          updated_at = NOW()
        RETURNING id
      `

      const userId = userResult[0].id

      // Create provider record
      console.log(`Creating provider: ${providerData.businessName}`)

      const providerResult = await sql`
        INSERT INTO providers (
          user_id, business_name, address, city, province, postal_code, 
          description, accreditation_status, is_active
        )
        VALUES (
          ${userId}, 
          ${providerData.businessName}, 
          ${providerData.address}, 
          ${providerData.city}, 
          ${providerData.province}, 
          ${providerData.postalCode}, 
          ${providerData.description}, 
          'accredited', 
          true
        )
        ON CONFLICT (user_id) DO UPDATE SET
          business_name = ${providerData.businessName},
          address = ${providerData.address},
          description = ${providerData.description},
          updated_at = NOW()
        RETURNING id
      `

      const providerId = providerResult[0].id

      // Create accommodation
      console.log(`Creating accommodation for: ${providerData.businessName}`)

      await sql`
        INSERT INTO accommodations (
          provider_id, name, description, address, city, province, postal_code,
          accommodation_type, total_rooms, available_rooms, price_per_month,
          amenities, is_active
        )
        VALUES (
          ${providerId},
          ${providerData.businessName + " - Main Building"},
          ${providerData.description},
          ${providerData.address},
          ${providerData.city},
          ${providerData.province},
          ${providerData.postalCode},
          'residence',
          ${providerData.totalRooms},
          ${Math.floor(providerData.totalRooms * 0.3)},
          ${providerData.pricePerMonth},
          ARRAY['WiFi', 'Security', 'Laundry', 'Study Areas', 'Parking', 'Common Room'],
          true
        )
        ON CONFLICT DO NOTHING
      `
    }

    console.log("Accredited providers seeding completed successfully!")
    console.log(`Created ${accreditedProviders.length} accredited providers with accommodations`)
    console.log("")
    console.log("Provider login credentials:")
    console.log("   Email: [provider-email]@[domain].co.za (see console output above)")
    console.log("   Temporary Password: TempPassword123!")
    console.log("")
    console.log("Providers should change their passwords on first login")
  } catch (error) {
    console.error("Error seeding accredited providers:", error)
    process.exit(1)
  }
}

seedAccreditedProviders()
