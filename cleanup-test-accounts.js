const { neon } = require('@neondatabase/serverless')
const { config } = require('dotenv')

config({ path: '.env.local' })

async function cleanupTestAccounts() {
  try {
    const sql = neon(process.env.DATABASE_URL)
    
    console.log('🧹 Starting cleanup of test accounts...')
    
    // Get all test accounts except testprovider@example.com
    const testAccounts = await sql`
      SELECT id, email FROM users 
      WHERE email LIKE '%test%' OR email LIKE '%provider%'
      AND email != 'testprovider@example.com'
    `
    
    console.log(`Found ${testAccounts.length} test accounts to delete:`)
    testAccounts.forEach(acc => console.log(`- ${acc.email} (${acc.id})`))
    
    if (testAccounts.length === 0) {
      console.log('No test accounts to delete.')
      return
    }
    
    const userIds = testAccounts.map(u => u.id)
    
    // Delete accommodations for these users first
    console.log('\n🗑️ Deleting accommodations...')
    const accommodationResult = await sql`
      DELETE FROM accommodations 
      WHERE provider_id IN (
        SELECT id FROM providers WHERE user_id = ANY(${userIds})
      )
    `
    console.log(`Deleted ${accommodationResult.length} accommodations`)
    
    // Delete providers for these users
    console.log('🗑️ Deleting providers...')
    const providerResult = await sql`
      DELETE FROM providers WHERE user_id = ANY(${userIds})
    `
    console.log(`Deleted ${providerResult.length} providers`)
    
    // Delete users
    console.log('🗑️ Deleting users...')
    const userResult = await sql`
      DELETE FROM users WHERE id = ANY(${userIds})
    `
    console.log(`Deleted ${userResult.length} users`)
    
    // Verify what's left
    console.log('\n✅ Cleanup complete! Remaining test accounts:')
    const remainingAccounts = await sql`
      SELECT email, first_name, last_name, role FROM users 
      WHERE email LIKE '%test%' OR email LIKE '%provider%'
    `
    
    remainingAccounts.forEach(acc => {
      console.log(`- ${acc.email} (${acc.first_name} ${acc.last_name}) - ${acc.role}`)
    })
    
    console.log('\n🎯 You can now use: testprovider@example.com / TempPassword123!')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

cleanupTestAccounts()
