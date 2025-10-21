import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { query } from "@/lib/database"
// import { getStackServerApp } from "@/lib/stack"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') || ''
    const userId = searchParams.get('userId') || ''
    const redirectTo = searchParams.get('redirect_to') || ''

    if (!token || !userId) {
      return NextResponse.redirect(new URL('/auth/check-email', request.url))
    }

    const key = `verify:${userId}`
    const stored = (await redis.get(key)) as string | null
    if (!stored || stored !== token) {
      return NextResponse.redirect(new URL('/auth/check-email', request.url))
    }

    // Invalidate token
    await redis.del(key)

    // Ensure our DB reflects verification and that a student record exists
    try {
      await query`UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = ${userId}`

      // Create student record if missing; attempt to infer university from email domain
      const userRes = await query`
        SELECT email, student_number, institution FROM users WHERE id = ${userId} LIMIT 1
      `
      const email: string = userRes.rows?.[0]?.email || ''
      const institution: string = userRes.rows?.[0]?.institution || ''
      const studentNumber: string = userRes.rows?.[0]?.student_number || ''

      const domain = email.substring(email.indexOf('@'))
      let university: 'UFS' | 'CUT' | null = null
      if (domain === '@ufs4life.ac.za' || domain === '@ufs.ac.za' || domain === '@student.ufs.ac.za') university = 'UFS'
      if (domain === '@cut.ac.za' || domain === '@student.cut.ac.za') university = university || 'CUT'
      if (!university && institution) {
        if (institution.toUpperCase() === 'UFS') university = 'UFS'
        if (institution.toUpperCase() === 'CUT') university = 'CUT'
      }

      const existingStudent = await query`
        SELECT id FROM students WHERE user_id = ${userId} LIMIT 1
      `
      if (existingStudent.rowCount === 0) {
        await query`
          INSERT INTO students (id, user_id, student_number, university, created_at, updated_at)
          VALUES (uuid_generate_v4()::text, ${userId}, ${studentNumber || null}, ${university || 'UFS'}, NOW(), NOW())
        `
      }
    } catch {}

    // Redirect to email-verified (which will route to dashboard), honoring redirect param
    const base = new URL('/auth/email-verified', request.url)
    if (redirectTo) base.searchParams.set('redirect_to', redirectTo)
    return NextResponse.redirect(base)
  } catch (error) {
    return NextResponse.redirect(new URL('/auth/check-email', request.url))
  }
}


