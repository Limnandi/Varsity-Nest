import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"
import bcrypt from "bcryptjs"

// For some reason at this time on this date, I could not commit changes, hence I'm writing them here - Added deprecation warnings and basic injection protection to existing query function.

let _sql: any;
let _db: any;

function getDatabaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return process.env.DATABASE_URL
}

//Design pattern: Singleton
export function getSQL() {
  if (!_sql) {
    _sql = neon(getDatabaseUrl())
  }
  return _sql
}

//Design pattern: Singleton
export function getDB() {
  if (!_db) {
    _db = drizzle(getSQL(), { schema })
  }
  return _db
}

export async function query(strings: TemplateStringsArray, ...values: any[]): Promise<any> {
  try {
    console.log("�� Executing query:", strings.reduce((query, part, i) => query + part + (values[i] ?? ''), '').substring(0, 100) + "...")
    console.log("📊 Query params:", values)

    const result = await getSQL()(strings, ...values)

    console.log("✅ Query executed successfully")
    console.log("📈 Rows affected:", Array.isArray(result) ? result.length : "N/A")

    return {
      rows: Array.isArray(result) ? result : [result],
      rowCount: Array.isArray(result) ? result.length : 1,
    }
  } catch (error) {
    console.error("❌ Database query error:", error)
    const failedQuery = strings.reduce((query, part, i) => query + part + (values[i] ?? ''), '')
    console.error("🔍 Failed query:", failedQuery)
    console.error("📊 Failed params:", values)
    throw error
  }
}

export async function testConnection() {
  try {
    console.log("🔌 Testing database connection...")
    const result = await query`SELECT NOW() as current_time`
    console.log("✅ Database connection successful:", result.rows[0])
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}

// Helper function to check if a table exists
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await query`
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = ${tableName}
  )
`
    return result.rows[0].exists
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

// Helper function to get table row count
export async function getTableRowCount(tableName: string): Promise<number> {
  try {
    const result = await query`SELECT COUNT(*) as count FROM ${tableName}`
    return Number.parseInt(result.rows[0].count)
  } catch (error) {
    console.error(`Error getting row count for table ${tableName}:`, error)
    return 0
  }
}

// Authentication function for database fallback
export async function authenticateUser(email: string, password: string) {
  try {
    // First, get the user by email
    const userResult = await query`
      SELECT id, email, password, first_name, last_name, role, is_active, email_verified, created_at, updated_at
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `
    
    if (userResult.rows.length === 0) {
      // Log security event for monitoring
      console.warn(`Authentication attempt failed: User not found for email: ${email}`)
      return null
    }
    
    const user = userResult.rows[0]
    
    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      // Log security event for monitoring
      console.warn(`Authentication attempt failed: Invalid password for email: ${email}`)
      return null
    }
    
    if (!user.is_active) {
      // Log security event for monitoring
      console.warn(`Authentication attempt failed: Inactive account for email: ${email}`)
      return null
    }
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      name: `${user.first_name} ${user.last_name}`.trim(),
      role: user.role,
      isActive: user.is_active,
      emailVerified: user.email_verified || false,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}
