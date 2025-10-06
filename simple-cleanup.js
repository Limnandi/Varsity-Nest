const { neon } = require('@neondatabase/serverless')
const { config } = require('dotenv')

config({ path: '.env.local' })

async function simpleCleanup() {
  try {
    const sql = neon(process.env.DATABASE_URL)
    
    console.log('🧹 Simple cleanup starting...')
    
    // Delete all accommodations first
    console.log('🗑️ Deleting all accommodations...')
    await sql`DELETE FROM accommodations`
    console.log('✅ All accommodations deleted')
    
    // Delete all providers
    console.log('🗑️ Deleting all providers...')
    await sql`DELETE FROM providers`
    console.log('✅ All providers deleted')
    
    // Delete all test users
    console.log('🗑️ Deleting all test users...')
    await sql`
      DELETE FROM users 
      WHERE email LIKE '%test%' OR email LIKE '%provider%'
    `
    console.log('✅ All test users deleted')
    
    // Create fresh test provider account
    console.log('🔧 Creating fresh test provider...')
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('TempPassword123!', 10)
    
    // Create user
    const userResult = await sql`
      INSERT INTO users (
        email,
        password,
        first_name,
        last_name,
        role,
        email_verified,
        is_active
      ) VALUES (
        'testprovider@example.com',
        ${hashedPassword},
        'Test',
        'Provider',
        'provider',
        true,
        true
      ) RETURNING id, email
    `
    
    const user = userResult[0]
    console.log(`✅ User created: ${user.email} (${user.id})`)
    
    // Create provider
    const providerResult = await sql`
      INSERT INTO providers (
        user_id,
        business_name,
        contact_person,
        contact_email,
        contact_phone,
        address,
        is_verified,
        is_active,
        accreditation_status,
        city,
        province,
        postal_code
      ) VALUES (
        ${user.id},
        'Test Accommodation Provider',
        'Test Contact',
        'testprovider@example.com',
        '+27123456789',
        '123 Test Street, Testville, 1234',
        true,
        true,
        'accredited',
        'Bloemfontein',
        'Free State',
        '9300'
      ) RETURNING id
    `
    
    const provider = providerResult[0]
    console.log(`✅ Provider created: ${provider.id}`)
    
    // Create test accommodation
    console.log('🏠 Creating test accommodation...')
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
        is_active,
        is_published,
        listing_status,
        has_single_rooms,
        has_sharing_rooms,
        single_room_price,
        sharing_room_price,
        total_rooms,
        available_rooms,
        area,
        city,
        province,
        postal_code
      ) VALUES (
        'Test Student Residence',
        'Modern student accommodation with various room options. Perfect for UFS students with both single and sharing room options available.',
        '123 University Street, Bloemfontein, 9300',
        3000,
        '["/placeholder.jpg"]',
        '["wifi", "laundry", "study_room", "gym", "security", "parking"]',
        'accredited',
        ${provider.id},
        'info@testresidence.co.za',
        '+27 51 123 4567',
        true,
        true,
        'published',
        true,
        true,
        3500,
        2200,
        32,
        23,
        'Universitas',
        'Bloemfontein',
        'Free State',
        '9300'
      ) RETURNING id, name, is_published
    `
    
    const accommodation = accommodationResult[0]
    console.log(`✅ Accommodation created: ${accommodation.name} (${accommodation.id})`)
    console.log(`   Published: ${accommodation.is_published}`)
    
    console.log('\n🎯 Cleanup complete!')
    console.log('📧 Email: testprovider@example.com')
    console.log('🔑 Password: TempPassword123!')
    console.log('🏠 Accommodation: Test Student Residence (Published)')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

simpleCleanup()
