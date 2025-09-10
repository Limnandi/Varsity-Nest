import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/stackauth'
import { secureDb } from '@/lib/database-secure'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/schema'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = params.id
    const body = await request.json()

    // Ensure ownership
    const owner = await query`SELECT provider_id FROM accommodations WHERE id = ${id} LIMIT 1`
    if (!owner.rows?.[0] || owner.rows[0].provider_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build dynamic update set
    const fields: string[] = []
    const values: any[] = []
    const allowed = ['name','description','address','price','amenities','images','area','distance','featured','available_rooms','total_rooms','is_verified','is_open']
    for (const key of allowed) {
      if (key in body) {
        fields.push(`${key} = $${fields.length + 1}`)
        if (key === 'amenities' || key === 'images') values.push(JSON.stringify(body[key]))
        else values.push(body[key])
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const text = `UPDATE accommodations SET ${fields.join(', ')} WHERE id = $${fields.length + 1} RETURNING *`
    const res = await query([text] as any, ...values, id)
    return NextResponse.json(res.rows?.[0] || null)
  } catch (error) {
    console.error('Update accommodation error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = params.id
    const [owner] = await secureDb.db
      .select({ providerId: schema.accommodations.providerId })
      .from(schema.accommodations)
      .where(eq(schema.accommodations.id, id))
      .limit(1)
    
    if (!owner || owner.providerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await secureDb.db
      .delete(schema.accommodations)
      .where(eq(schema.accommodations.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete accommodation error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}


