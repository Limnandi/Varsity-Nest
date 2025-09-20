import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"
import { env } from "@/lib/env"
import { eq, and, or, desc, asc, sql, count, sum, avg, max, min } from "drizzle-orm"
import { z } from "zod"
import { randomUUID } from "crypto"

let _sql: any;
let _db: any;

function getDatabaseUrl(): string {
  return env.DATABASE_URL
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

// Input validation schemas
export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email().max(255),
  password: z.string().min(8).max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['admin', 'provider', 'student']),
  phone: z.string().max(20).optional(),
  studentNumber: z.string().max(50).optional(),
  institution: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false)
})

export const AccommodationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  address: z.string().min(1).max(500),
  price: z.number().positive(),
  images: z.array(z.string().url()).default([]),
  amenities: z.array(z.string()).default([]),
  accreditationStatus: z.enum(['accredited', 'provisionally_accredited', 'non_accredited']),
  providerId: z.string().uuid(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  websiteUrl: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  roomTypes: z.array(z.string()).default([]),
  maxOccupancy: z.number().positive().optional(),
  availableFrom: z.date().optional(),
  availableUntil: z.date().optional(),
  isActive: z.boolean().default(true)
})

export const BookingSchema = z.object({
  id: z.string().uuid().optional(),
  studentId: z.string().uuid(),
  accommodationId: z.string().uuid(),
  checkInDate: z.date(),
  checkOutDate: z.date(),
  totalAmount: z.number().positive(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).default('pending'),
  specialRequests: z.string().max(1000).optional()
})

// Secure query wrapper with built-in validation
export class SecureDatabase {
  public db = getDB()
  public sql = getSQL()

  // Secure user operations
  async createUser(userData: z.infer<typeof UserSchema>) {
    const validatedData = UserSchema.parse(userData)
    
    const [user] = await this.db.insert(schema.users).values({
      id: validatedData.id || randomUUID(),
      email: validatedData.email.toLowerCase(),
      password: validatedData.password, // Should be hashed before calling this
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: validatedData.role,
      phone: validatedData.phone,
      studentNumber: validatedData.studentNumber,
      institution: validatedData.institution,
      isActive: validatedData.isActive,
      emailVerified: validatedData.emailVerified
    }).returning()

    return user
  }

  async getUserById(id: string) {
    if (!z.string().uuid().safeParse(id).success) {
      throw new Error("Invalid user ID format")
    }

    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1)

    return user
  }

  async getUserByEmail(email: string) {
    if (!z.string().email().safeParse(email).success) {
      throw new Error("Invalid email format")
    }

    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .limit(1)

    return user
  }

  async updateUser(id: string, updateData: Partial<z.infer<typeof UserSchema>>) {
    if (!z.string().uuid().safeParse(id).success) {
      throw new Error("Invalid user ID format")
    }

    const validatedData = UserSchema.partial().parse(updateData)
    
    const [user] = await this.db
      .update(schema.users)
      .set({
        ...validatedData,
        email: validatedData.email?.toLowerCase(),
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, id))
      .returning()

    return user
  }

  async deleteUser(id: string) {
    if (!z.string().uuid().safeParse(id).success) {
      throw new Error("Invalid user ID format")
    }

    await this.db.delete(schema.users).where(eq(schema.users.id, id))
    return { success: true }
  }

  // Secure accommodation operations
  async createAccommodation(accommodationData: z.infer<typeof AccommodationSchema>) {
    const validatedData = AccommodationSchema.parse(accommodationData)
    
    const [accommodation] = await this.db.insert(schema.accommodations).values({
      id: validatedData.id || randomUUID(),
      name: validatedData.name,
      description: validatedData.description,
      address: validatedData.address,
      price: validatedData.price,
      images: validatedData.images,
      amenities: validatedData.amenities,
      accreditationStatus: validatedData.accreditationStatus,
      providerId: validatedData.providerId,
      contactEmail: validatedData.contactEmail,
      contactPhone: validatedData.contactPhone,
      websiteUrl: validatedData.websiteUrl,
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      roomTypes: validatedData.roomTypes,
      maxOccupancy: validatedData.maxOccupancy,
      availableFrom: validatedData.availableFrom,
      availableUntil: validatedData.availableUntil,
      isActive: validatedData.isActive
    }).returning()

    return accommodation
  }

  async getAccommodationById(id: string) {
    if (!z.string().uuid().safeParse(id).success) {
      throw new Error("Invalid accommodation ID format")
    }

    const [accommodation] = await this.db
      .select()
      .from(schema.accommodations)
      .where(eq(schema.accommodations.id, id))
      .limit(1)

    return accommodation
  }

  async getAccommodationsByProvider(providerId: string, limit = 50, offset = 0) {
    if (!z.string().uuid().safeParse(providerId).success) {
      throw new Error("Invalid provider ID format")
    }

    return await this.db
      .select()
      .from(schema.accommodations)
      .where(eq(schema.accommodations.providerId, providerId))
      .limit(limit)
      .offset(offset)
  }

  async updateAccommodation(id: string, updateData: Partial<z.infer<typeof AccommodationSchema>>) {
    if (!z.string().uuid().safeParse(id).success) {
      throw new Error("Invalid accommodation ID format")
    }

    const validatedData = AccommodationSchema.partial().parse(updateData)
    
    const [accommodation] = await this.db
      .update(schema.accommodations)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(schema.accommodations.id, id))
      .returning()

    return accommodation
  }

  async deleteAccommodation(id: string) {
    if (!z.string().uuid().safeParse(id).success) {
      throw new Error("Invalid accommodation ID format")
    }

    await this.db.delete(schema.accommodations).where(eq(schema.accommodations.id, id))
    return { success: true }
  }

  // Secure booking operations
  async createBooking(bookingData: z.infer<typeof BookingSchema>) {
    const validatedData = BookingSchema.parse(bookingData)
    
    const [booking] = await this.db.insert(schema.bookings).values({
      id: validatedData.id || randomUUID(),
      studentId: validatedData.studentId,
      accommodationId: validatedData.accommodationId,
      checkInDate: validatedData.checkInDate,
      checkOutDate: validatedData.checkOutDate,
      totalAmount: validatedData.totalAmount,
      status: validatedData.status,
      paymentStatus: validatedData.paymentStatus,
      specialRequests: validatedData.specialRequests
    }).returning()

    return booking
  }

  async getBookingById(id: string) {
    if (!z.string().uuid().safeParse(id).success) {
      throw new Error("Invalid booking ID format")
    }

    const [booking] = await this.db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, id))
      .limit(1)

    return booking
  }

  async getBookingsByStudent(studentId: string, limit = 50, offset = 0) {
    if (!z.string().uuid().safeParse(studentId).success) {
      throw new Error("Invalid student ID format")
    }

    return await this.db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.studentId, studentId))
      .orderBy(desc(schema.bookings.createdAt))
      .limit(limit)
      .offset(offset)
  }

  // Transaction support
  async withTransaction<T>(callback: (tx: SecureDatabase) => Promise<T>): Promise<T> {
    return await this.db.transaction(async (tx: any) => {
      const txDb = new SecureDatabase()
      txDb.db = tx
      return await callback(txDb)
    })
  }

  // Secure raw queries (only when absolutely necessary)
  async executeRawQuery(query: string, params: any[] = []) {
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

    return await this.sql(query, params)
  }

  // Statistics and analytics (secure)
  async getAccommodationStats() {
    const [stats] = await this.db
      .select({
        totalAccommodations: count(schema.accommodations.id),
        totalRevenue: sum(schema.bookings.totalAmount),
        averageRating: avg(schema.reviews.rating),
        totalBookings: count(schema.bookings.id)
      })
      .from(schema.accommodations)
      .leftJoin(schema.bookings, eq(schema.accommodations.id, schema.bookings.accommodationId))
      .leftJoin(schema.reviews, eq(schema.accommodations.id, schema.reviews.accommodationId))

    return stats
  }

  async getProviderStats(providerId: string) {
    if (!z.string().uuid().safeParse(providerId).success) {
      throw new Error("Invalid provider ID format")
    }

    const [stats] = await this.db
      .select({
        totalAccommodations: count(schema.accommodations.id),
        totalRevenue: sum(schema.bookings.totalAmount),
        averageRating: avg(schema.reviews.rating),
        totalBookings: count(schema.bookings.id)
      })
      .from(schema.accommodations)
      .leftJoin(schema.bookings, eq(schema.accommodations.id, schema.bookings.accommodationId))
      .leftJoin(schema.reviews, eq(schema.accommodations.id, schema.reviews.accommodationId))
      .where(eq(schema.accommodations.providerId, providerId))

    return stats
  }
}

// Export singleton instance
export const secureDb = new SecureDatabase()

// Legacy compatibility - secure wrapper for existing query function
export async function secureQuery(strings: TemplateStringsArray, ...values: any[]): Promise<any> {
  try {
    // Validate all values to prevent injection
    for (const value of values) {
      if (typeof value === 'string') {
        // Check for SQL injection patterns
        const dangerousPatterns = [
          /['";]/,  // Quotes and semicolons
          /--/,     // SQL comments
          /\/\*.*\*\//, // Block comments
          /(union|select|insert|update|delete|drop|create|alter|truncate)/i // SQL keywords
        ]
        
        if (dangerousPatterns.some(pattern => pattern.test(value))) {
          throw new Error(`Potentially dangerous value detected: ${value}`)
        }
      }
    }

    console.log("🔒 Executing secure query:", strings.reduce((query, part, i) => query + part + (values[i] ?? ''), '').substring(0, 100) + "...")
    console.log("📊 Query params:", values)

    const result = await getSQL()(strings, ...values)

    console.log("✅ Secure query executed successfully")
    console.log("📈 Rows affected:", Array.isArray(result) ? result.length : "N/A")

    return {
      rows: Array.isArray(result) ? result : [result],
      rowCount: Array.isArray(result) ? result.length : 1,
    }
  } catch (error) {
    console.error("❌ Secure database query error:", error)
    const failedQuery = strings.reduce((query, part, i) => query + part + (values[i] ?? ''), '')
    console.error("🔍 Failed query:", failedQuery)
    console.error("📊 Failed params:", values)
    throw error
  }
}
