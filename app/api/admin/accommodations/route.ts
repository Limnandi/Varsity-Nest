import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest } from '@/lib/auth-server'
import { secureDb } from '@/lib/database-secure'
import * as schema from '@/lib/schema'
import { sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  let user = await getCurrentUserFromRequest(request)
  if (!user) {
    try {
      const { getCurrentUserFromStackAuth } = await import('@/lib/auth-server')
      user = await getCurrentUserFromStackAuth()
    } catch {}
  }
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await secureDb.db
      .select({
        id: schema.accommodations.id,
        name: schema.accommodations.name,
        created_at: schema.accommodations.createdAt,
        is_active: schema.accommodations.isActive,
        provider_name: schema.providers.businessName,
        // is_published is not mapped in schema; select via raw SQL
        is_published: sql`accommodations.is_published` as unknown as boolean,
      })
      .from(schema.accommodations)
      .leftJoin(schema.providers, sql`${schema.accommodations.providerId} = ${schema.providers.id}`)
      .orderBy(sql`accommodations.created_at DESC`)
      .limit(500)
    return NextResponse.json({ accommodations: rows }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch accommodations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let user = await getCurrentUserFromRequest(request)
  if (!user) {
    try {
      const { getCurrentUserFromStackAuth } = await import('@/lib/auth-server')
      user = await getCurrentUserFromStackAuth()
    } catch {}
  }
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action } = body || {}

    if (action === 'toggle-active') {
      const { id, is_active } = body as { id: string; is_active: boolean }
      if (!id || typeof is_active !== 'boolean') {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
      }

      // Use the same secure connection as reads; mirror is_active to is_published on toggle
      const update = await secureDb.sql`
        UPDATE accommodations
        SET 
          is_active = ${is_active},
          is_published = ${is_active},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, name, created_at, is_active, is_published
      `

      if ((update as any).length === 0) {
        return NextResponse.json({ error: 'Accommodation not found' }, { status: 404 })
      }
      const updatedRow = Array.isArray(update) ? (update as any)[0] : (update as any).rows?.[0]
      return NextResponse.json({ accommodation: updatedRow }, { status: 200 })
    }

    if (action === 'toggle-published') {
      const { id, is_published } = body as { id: string; is_published: boolean }
      if (!id || typeof is_published !== 'boolean') {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
      }

      const update = await secureDb.sql`
        UPDATE accommodations
        SET 
          is_published = ${is_published},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, name, created_at, is_active, is_published
      `

      if ((update as any).length === 0) {
        return NextResponse.json({ error: 'Accommodation not found' }, { status: 404 })
      }
      const updatedRow = Array.isArray(update) ? (update as any)[0] : (update as any).rows?.[0]
      return NextResponse.json({ accommodation: updatedRow }, { status: 200 })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}


