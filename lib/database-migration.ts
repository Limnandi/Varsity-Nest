// Migration helper to gradually replace vulnerable query calls
import { secureDb } from './database-secure'

// This file provides migration utilities to replace vulnerable query calls
// with secure database operations

export async function migrateUserOperations() {
  // Example migration for user operations
  console.log("🔄 Migrating user operations to secure database...")
  
  // This will be used to replace vulnerable query calls in auth operations
  return secureDb
}

export async function migrateAccommodationOperations() {
  // Example migration for accommodation operations
  console.log("🔄 Migrating accommodation operations to secure database...")
  
  // This will be used to replace vulnerable query calls in accommodation operations
  return secureDb
}

export async function migrateBookingOperations() {
  // Example migration for booking operations
  console.log("🔄 Migrating booking operations to secure database...")
  
  // This will be used to replace vulnerable query calls in booking operations
  return secureDb
}

// Helper function to safely execute raw queries when absolutely necessary
export async function safeRawQuery(query: string, params: any[] = []) {
  // Validate that this is a safe query (no DDL, no dangerous operations)
  const dangerousPatterns = [
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /UPDATE\s+.*\s+SET/i,
    /INSERT\s+INTO/i,
    /ALTER\s+TABLE/i,
    /CREATE\s+TABLE/i,
    /TRUNCATE/i
  ]

  if (dangerousPatterns.some(pattern => pattern.test(query))) {
    throw new Error("Dangerous query detected. Use specific methods instead.")
  }

  return await secureDb.executeRawQuery(query, params)
}
