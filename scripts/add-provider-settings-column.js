#!/usr/bin/env node

import { query } from '../lib/database.ts'

async function addProviderSettingsColumn() {
  try {
    console.log('🔧 Adding settings column to providers table...')
    
    // Add settings column to providers table
    await query`
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
    
    await query`
      UPDATE providers 
      SET settings = ${JSON.stringify(defaultSettings)}
      WHERE settings IS NULL OR settings = '{}'::jsonb
    `
    
    console.log('✅ Updated existing providers with default settings')
    console.log('🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

addProviderSettingsColumn()
