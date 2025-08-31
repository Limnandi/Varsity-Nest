import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

let _sql: any;
let _db: any;

function getDatabaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return process.env.DATABASE_URL
}

export function getSQL() {
  if (!_sql) {
    _sql = neon(getDatabaseUrl())
  }
  return _sql
}

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
