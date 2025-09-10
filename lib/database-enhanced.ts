import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"
import { ErrorLoggingService, ErrorSeverity, ErrorCategory } from "./services/error-logging"

let _sql: any
let _db: any

function getDatabaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return process.env.DATABASE_URL
}

// Design pattern: Singleton
export function getSQL() {
  if (!_sql) {
    _sql = neon(getDatabaseUrl())
  }
  return _sql
}

// Design pattern: Singleton
export function getDB() {
  if (!_db) {
    _db = drizzle(getSQL(), { schema })
  }
  return _db
}

export async function query(strings: TemplateStringsArray, ...values: any[]): Promise<any> {
  try {
    const queryString = strings.reduce((query, part, i) => query + part + (values[i] ?? ''), '')
    
    // Log query in development only
    if (process.env.NODE_ENV === 'development') {
      console.log("🔒 Executing query:", queryString.substring(0, 100) + "...")
      console.log("📊 Query params:", values)
    }

    const result = await getSQL()(strings, ...values)

    // Log success in development only
    if (process.env.NODE_ENV === 'development') {
      console.log("✅ Query executed successfully")
      console.log("📈 Rows affected:", Array.isArray(result) ? result.length : "N/A")
    }

    return {
      rows: Array.isArray(result) ? result : [result],
      rowCount: Array.isArray(result) ? result.length : 1,
    }
  } catch (error) {
    // Log database error with proper context
    await ErrorLoggingService.logDatabaseError(
      error instanceof Error ? error : new Error(String(error)),
      strings.reduce((query, part, i) => query + part + (values[i] ?? ''), ''),
      values,
      {
        component: 'database_query'
      }
    )

    // Re-throw with enhanced error message
    const enhancedError = new Error(
      `Database query failed: ${error instanceof Error ? error.message : String(error)}`
    )
    enhancedError.stack = error instanceof Error ? error.stack : undefined
    throw enhancedError
  }
}

export async function testConnection() {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log("🔌 Testing database connection...")
    }
    
    const result = await query`SELECT 1 as test`
    
    if (process.env.NODE_ENV === 'development') {
      console.log("✅ Database connection successful:", result.rows[0])
    }
    
    return { success: true, result: result.rows[0] }
  } catch (error) {
    await ErrorLoggingService.logDatabaseError(
      error instanceof Error ? error : new Error(String(error)),
      "SELECT 1 as test",
      [],
      {
        component: 'database_connection_test'
      }
    )
    
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Enhanced query function with retry logic
export async function queryWithRetry(
  strings: TemplateStringsArray, 
  ...values: any[]
): Promise<any> {
  const { GlobalErrorHandler } = await import('./error-handler')
  
  return GlobalErrorHandler.withRetry(
    () => query(strings, ...values),
    3, // max retries
    1000, // base delay
    {
      component: 'database_query_retry',
      query: strings.reduce((query, part, i) => query + part + (values[i] ?? ''), '').substring(0, 100)
    }
  )
}

// Safe query function that returns undefined on error
export async function safeQuery(
  strings: TemplateStringsArray, 
  ...values: any[]
): Promise<any | undefined> {
  const { GlobalErrorHandler } = await import('./error-handler')
  
  return GlobalErrorHandler.safeAsync(
    () => query(strings, ...values),
    {
      component: 'database_safe_query',
      query: strings.reduce((query, part, i) => query + part + (values[i] ?? ''), '').substring(0, 100)
    }
  )
}
