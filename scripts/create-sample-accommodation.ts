// Simple script to create sample accommodation with room types
// Run with: npx tsx scripts/create-sample-accommodation.ts

import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"

// Load environment variables from .env.local
config({ path: '.env.local' })

async function createSampleAccommodation() {
  try {
    console.log('Creating sample accommodation with room types...')
    
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set!')
      console.log('Please make sure you have a .env file with DATABASE_URL')
      return
    }
    
    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL)
    
    // First, get a provider ID
    const providerResult = await sql`
      SELECT id FROM providers LIMIT 1
    `
    
    if (providerResult.length === 0) {
      console.log('No providers found. Please create a provider first.')
      return
    }
    
    const providerId = providerResult[0].id
    
    // Create accommodation with room types
    const accommodationResult = await sql`
      INSERT INTO accommodations (
        name,
        description,
        address,
        price,
        images,
        amenities,
        accreditation_status,
        provider_id,
        contact_email,
        contact_phone,
        room_types,
        is_active
      ) VALUES (
        'Test Student Residence',
        'Modern student accommodation with various room options',
        '123 University Street, Bloemfontein, 9300',
        3000,
        '["/placeholder.jpg"]',
        '["wifi", "laundry", "study_room", "gym"]',
        'accredited',
        ${providerId},
        'info@testresidence.co.za',
        '+27 51 123 4567',
        '[
          {
            "id": "single-room",
            "name": "Single Room",
            "type": "single",
            "price": 3500,
            "description": "Private single occupancy room with ensuite bathroom",
            "amenities": ["wifi", "ensuite", "study_desk"],
            "images": [],
            "availableCount": 8,
            "totalCount": 12,
            "isActive": true
          },
          {
            "id": "sharing-room",
            "name": "Sharing Room",
            "type": "sharing",
            "price": 2200,
            "description": "Shared room with other students, perfect for social living",
            "amenities": ["wifi", "ensuite", "shared_kitchen"],
            "images": [],
            "availableCount": 15,
            "totalCount": 20,
            "isActive": true
          }
        ]',
        true
      ) RETURNING id, name
    `
    
    const accommodation = accommodationResult[0]
    console.log(`✅ Created accommodation: ${accommodation.name} (ID: ${accommodation.id})`)
    console.log('Room types:')
    console.log('- Single Room: R3,500/month (8 available)')
    console.log('- Sharing Room: R2,200/month (15 available)')
    console.log('')
    console.log('You can now view this accommodation at:')
    console.log(`http://localhost:3000/listing/${accommodation.id}`)
    
  } catch (error) {
    console.error('Error creating sample accommodation:', error)
  }
}

createSampleAccommodation()
