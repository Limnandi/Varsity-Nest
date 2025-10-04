#!/usr/bin/env node

// Load environment variables
import { readFileSync } from 'fs'
import { join } from 'path'

try {
  const envPath = join(process.cwd(), '.env.local')
  const envContent = readFileSync(envPath, 'utf8')
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
} catch (error) {
  console.log('⚠️  Could not load .env.local file:', error.message)
}

// Import database connection
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

async function addProviderSettingsColumn() {
  try {
    console.log('🔧 Adding settings column to providers table...')
    
    // Add settings column to providers table
    await sql`
      ALTER TABLE providers 
      ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb
    `
    
    console.log('✅ Successfully added settings column to providers table')
    
    // Update existing providers with default settings
    const defaultSettings = {
      autoApproveBookings: false,
      allowInstantBooking: true,
      requireDeposit: true,
      depositPercentage: 20,
      emailNotifications: true,
      smsNotifications: false,
      bookingAlerts: true,
      paymentAlerts: true,
      maintenanceAlerts: true,
      showContactInfo: true,
      allowDirectContact: true,
      showAvailability: true,
      autoRenewal: true,
      billingReminders: true,
      twoFactorAuth: false,
      sessionTimeout: 30,
      loginAlerts: true
    }
    
    await sql`
      UPDATE providers 
      SET settings = ${JSON.stringify(defaultSettings)}
      WHERE settings IS NULL OR settings = '{}'::jsonb
    `
    
    console.log('✅ Updated existing providers with default settings')
    console.log('🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    // No need to close connection with neon
  }
}

addProviderSettingsColumn()
