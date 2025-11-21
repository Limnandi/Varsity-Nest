import { NextRequest, NextResponse } from "next/server"
import { secureDb } from "@/lib/database-secure"
import * as schema from "@/lib/schema"
import { eq, inArray, and } from "drizzle-orm"
import { getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { randomUUID } from "crypto"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromStackAuth()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Student access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get("ids")

    if (!idsParam) {
      return NextResponse.json({ error: "ids query parameter is required" }, { status: 400 })
    }

    const uniqueIds = Array.from(
      new Set(
        idsParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      )
    ).slice(0, 100) // Prevent excessive payloads

    if (uniqueIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { statuses: {} },
        message: "No accommodation ids provided",
      })
    }

    // Ensure student record exists
    const existingStudent = await secureDb.db
      .select({ id: schema.students.id })
      .from(schema.students)
      .where(eq(schema.students.userId, user.id))
      .limit(1)

    let studentId: string
    if (existingStudent.length === 0) {
      const newStudentId = randomUUID()
      await secureDb.db.insert(schema.students).values({
        id: newStudentId,
        userId: user.id,
        studentNumber: user.studentNumber || "N/A",
        university: user.institution === "UFS" ? "UFS" : "CUT",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      studentId = newStudentId
    } else {
      studentId = existingStudent[0].id
    }

    const wishlistRows = await secureDb.db
      .select({ accommodationId: schema.studentWishlist.accommodationId })
      .from(schema.studentWishlist)
      .where(
        and(
          eq(schema.studentWishlist.studentId, studentId),
          inArray(schema.studentWishlist.accommodationId, uniqueIds)
        )
      )

    const statuses: Record<string, boolean> = {}
    for (const id of uniqueIds) {
      statuses[id] = false
    }
    for (const row of wishlistRows) {
      statuses[row.accommodationId] = true
    }

    return NextResponse.json({
      success: true,
      data: { statuses },
      message: "Wishlist statuses retrieved successfully",
    })
  } catch (error) {
    console.error("Wishlist status fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch wishlist statuses" }, { status: 500 })
  }
}


