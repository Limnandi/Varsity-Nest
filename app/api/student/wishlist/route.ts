import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import { eq, and, desc, like, or } from "drizzle-orm"
import * as schema from "@/lib/schema"
import { getCurrentUserFromRequest } from "@/lib/auth-server"
import { z } from "zod"
import { randomUUID } from "crypto"

// Validation schema for wishlist operations
const wishlistAddSchema = z.object({
  accommodationId: z.string().min(1, "Accommodation ID is required"),
})

const wishlistQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "accredited", "provisionally_accredited", "non_accredited"]).optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  accommodationId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Student access required" }, { status: 403 })
    }

    console.log('User data for wishlist GET:', {
      id: user.id,
      role: user.role,
      studentNumber: user.studentNumber,
      institution: user.institution
    })

    // Ensure student record exists
    const existingStudent = await secureDb.db
      .select({ id: schema.students.id })
      .from(schema.students)
      .where(eq(schema.students.userId, user.id))
      .limit(1)

    let studentId: string
    if (existingStudent.length === 0) {
      // Create student record if it doesn't exist
      const newStudentId = randomUUID()
      await secureDb.db
        .insert(schema.students)
        .values({
          id: newStudentId,
          userId: user.id,
          studentNumber: user.studentNumber || 'N/A',
          university: user.institution === 'UFS' ? 'UFS' : 'CUT',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      studentId = newStudentId
    } else {
      studentId = existingStudent[0].id
    }

    const { searchParams } = new URL(request.url)
    const queryValidation = wishlistQuerySchema.safeParse({
      search: searchParams.get("search"),
      status: searchParams.get("status"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      accommodationId: searchParams.get("accommodationId"),
    })

    if (!queryValidation.success) {
      return NextResponse.json({ 
        error: "Invalid query parameters", 
        details: queryValidation.error.issues 
      }, { status: 400 })
    }

    const { search, status, page, limit, accommodationId } = queryValidation.data
    const offset = (page - 1) * limit

    // Build the query
    let whereConditions = [eq(schema.studentWishlist.studentId, studentId)]

    // If checking for specific accommodation, add that filter
    if (accommodationId) {
      whereConditions.push(eq(schema.studentWishlist.accommodationId, accommodationId))
    }

    // Add search filter
    if (search) {
      whereConditions.push(
        or(
          like(schema.accommodations.name, `%${search}%`),
          like(schema.accommodations.address, `%${search}%`)
        )!
      )
    }

    // Add status filter
    if (status !== "all") {
      whereConditions.push(eq(schema.accommodations.accreditationStatus, status))
    }

    // Get wishlist items with accommodation details
    console.log('Querying wishlist with studentId:', studentId, 'whereConditions:', whereConditions)
    const wishlistItems = await secureDb.db
      .select({
        id: schema.studentWishlist.id,
        accommodationId: schema.studentWishlist.accommodationId,
        addedAt: schema.studentWishlist.createdAt,
        accommodation: {
          id: schema.accommodations.id,
          name: schema.accommodations.name,
          address: schema.accommodations.address,
          price: schema.accommodations.price,
          images: schema.accommodations.images,
          rating: schema.accommodations.rating,
          reviewCount: schema.accommodations.reviewCount,
          accreditationStatus: schema.accommodations.accreditationStatus,
          contactEmail: schema.accommodations.contactEmail,
          contactPhone: schema.accommodations.contactPhone,
          websiteUrl: schema.accommodations.websiteUrl,
          isActive: schema.accommodations.isActive,
        }
      })
      .from(schema.studentWishlist)
      .innerJoin(schema.accommodations, eq(schema.studentWishlist.accommodationId, schema.accommodations.id))
      .where(and(...whereConditions))
      .orderBy(desc(schema.studentWishlist.createdAt))
      .limit(limit)
      .offset(offset)
    
    console.log('Wishlist items found:', wishlistItems.length)

    // Get total count for pagination
    const totalCount = await secureDb.db
      .select({ count: schema.studentWishlist.id })
      .from(schema.studentWishlist)
      .innerJoin(schema.accommodations, eq(schema.studentWishlist.accommodationId, schema.accommodations.id))
      .where(and(...whereConditions))

    return NextResponse.json({
      success: true,
      data: {
        items: wishlistItems,
        pagination: {
          page,
          limit,
          total: totalCount.length,
          totalPages: Math.ceil(totalCount.length / limit),
        }
      },
      message: "Wishlist retrieved successfully"
    })

  } catch (error) {
    console.error("Error fetching wishlist:", error)
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Student access required" }, { status: 403 })
    }

    console.log('User data for wishlist POST:', {
      id: user.id,
      role: user.role,
      studentNumber: user.studentNumber,
      institution: user.institution
    })

    // Ensure student record exists and get the student ID
    let studentId: string
    const existingStudent = await secureDb.db
      .select({ id: schema.students.id })
      .from(schema.students)
      .where(eq(schema.students.userId, user.id))
      .limit(1)

    if (existingStudent.length === 0) {
      // Create student record if it doesn't exist
      try {
        console.log('Creating student record for user:', user.id, 'institution:', user.institution)
        const newStudentId = randomUUID()
        await secureDb.db
          .insert(schema.students)
          .values({
            id: newStudentId,
            userId: user.id,
            studentNumber: user.studentNumber || 'N/A',
            university: user.institution === 'UFS' ? 'UFS' : 'CUT',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        studentId = newStudentId
        console.log('Student record created successfully with ID:', studentId)
      } catch (error) {
        console.error('Error creating student record:', error)
        return NextResponse.json({ 
          error: "Failed to create student record", 
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    } else {
      studentId = existingStudent[0].id
      console.log('Student record already exists for user:', user.id, 'student ID:', studentId)
    }

    const body = await request.json()
    const validation = wishlistAddSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid input data", 
        details: validation.error.issues 
      }, { status: 400 })
    }

    const { accommodationId } = validation.data

    // Check if accommodation exists and is active
    const accommodation = await secureDb.db
      .select({ id: schema.accommodations.id, isActive: schema.accommodations.isActive })
      .from(schema.accommodations)
      .where(eq(schema.accommodations.id, accommodationId))
      .limit(1)

    if (accommodation.length === 0) {
      return NextResponse.json({ error: "Accommodation not found" }, { status: 404 })
    }

    if (!accommodation[0].isActive) {
      return NextResponse.json({ error: "Accommodation is not available" }, { status: 400 })
    }

    // Check if already in wishlist
    const existingWishlistItem = await secureDb.db
      .select({ id: schema.studentWishlist.id })
      .from(schema.studentWishlist)
      .where(
        and(
          eq(schema.studentWishlist.studentId, studentId),
          eq(schema.studentWishlist.accommodationId, accommodationId)
        )
      )
      .limit(1)

    if (existingWishlistItem.length > 0) {
      return NextResponse.json({ error: "Accommodation already in wishlist" }, { status: 409 })
    }

    // Add to wishlist
    await secureDb.db
      .insert(schema.studentWishlist)
      .values({
        studentId: studentId,
        accommodationId,
      })

    return NextResponse.json({
      success: true,
      message: "Added to wishlist successfully",
    })

  } catch (error) {
    console.error("Error adding to wishlist:", error)
    return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Student access required" }, { status: 403 })
    }

    // Ensure student record exists
    const existingStudent = await secureDb.db
      .select({ id: schema.students.id })
      .from(schema.students)
      .where(eq(schema.students.userId, user.id))
      .limit(1)

    let studentId: string
    if (existingStudent.length === 0) {
      // Create student record if it doesn't exist
      const newStudentId = randomUUID()
      await secureDb.db
        .insert(schema.students)
        .values({
          id: newStudentId,
          userId: user.id,
          studentNumber: user.studentNumber || 'N/A',
          university: user.institution === 'UFS' ? 'UFS' : 'CUT',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      studentId = newStudentId
    } else {
      studentId = existingStudent[0].id
    }

    const { searchParams } = new URL(request.url)
    const accommodationId = searchParams.get("accommodationId")

    if (!accommodationId) {
      return NextResponse.json({ error: "Accommodation ID is required" }, { status: 400 })
    }

    // Remove from wishlist
    const result = await secureDb.db
      .delete(schema.studentWishlist)
      .where(
        and(
          eq(schema.studentWishlist.studentId, studentId),
          eq(schema.studentWishlist.accommodationId, accommodationId)
        )
      )
      .returning({ id: schema.studentWishlist.id })

    if (result.length === 0) {
      return NextResponse.json({ error: "Item not found in wishlist" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Removed from wishlist successfully",
    })

  } catch (error) {
    console.error("Error removing from wishlist:", error)
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 })
  }
}