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

export async function query(text: string, params?: any[]): Promise<any>;
export async function query(strings: TemplateStringsArray, ...values: any[]): Promise<any>;
export async function query(textOrStrings: string | TemplateStringsArray, paramsOrValues?: any[] | any, ...restValues: any[]): Promise<any> {
  try {
    let queryText: string;
    let queryParams: any[];

    if (typeof textOrStrings === 'string') {
      queryText = textOrStrings;
      queryParams = paramsOrValues as any[] || [];
    } else {
      queryText = (textOrStrings as TemplateStringsArray).reduce(
        (query, part, i) => query + part + (paramsOrValues[i] ?? ''),
        ''
      );
      queryParams = paramsOrValues as any[] || [];
    }

    console.log("🔍 Executing query:", queryText.substring(0, 100) + "...")
    console.log("📊 Query params:", queryParams)

    const result = await (typeof textOrStrings === 'string'
      ? getSQL()`${queryText}`
      : getSQL()(textOrStrings as TemplateStringsArray, ...queryParams))

    console.log("✅ Query executed successfully")
    console.log("📈 Rows affected:", Array.isArray(result) ? result.length : "N/A")

    return {
      rows: Array.isArray(result) ? result : [result],
      rowCount: Array.isArray(result) ? result.length : 1,
    }
  } catch (error) {
    console.error("❌ Database query error:", error)
    if (typeof textOrStrings === 'string') {
      console.error("🔍 Failed query:", textOrStrings)
      console.error("📊 Failed params:", paramsOrValues)
    } else {
      const failedQuery = (textOrStrings as TemplateStringsArray).reduce(
        (query, part, i) => query + part + (paramsOrValues[i] ?? ''),
        ''
      )
      console.error("🔍 Failed query:", failedQuery)
      console.error("📊 Failed params:", paramsOrValues)
    }
    throw error
  }
}

export async function testConnection() {
  try {
    console.log("🔌 Testing database connection...")
    const result = await query("SELECT NOW() as current_time")
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
    const result = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName],
    )
    return result.rows[0].exists
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

// Helper function to get table row count
export async function getTableRowCount(tableName: string): Promise<number> {
  try {
    const result = await query(`SELECT COUNT(*) as count FROM ${tableName}`)
    return Number.parseInt(result.rows[0].count)
  } catch (error) {
    console.error(`Error getting row count for table ${tableName}:`, error)
    return 0
  }
}
