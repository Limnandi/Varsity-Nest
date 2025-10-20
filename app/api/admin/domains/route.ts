import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/stackauth"
import { query } from "@/lib/database"

// GET - Fetch all whitelisted domains
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await query`
      SELECT id, domain, university, created_at, is_active
      FROM whitelisted_domains
      ORDER BY created_at DESC
    `
    const domains = result.rows.map((row: any) => ({
      id: row.id,
      domain: row.domain,
      university: row.university,
      createdAt: row.created_at,
      isActive: row.is_active,
    }))

    return NextResponse.json({ domains })
  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 })
  }
}

// POST - Add new domain or update existing
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, domain, university, domainId: _domainId, isActive: _isActive } = body

    if (action === 'add') {
      // Add new domain
      const _formattedDomain = domain.startsWith('@') ? domain : `@${domain}`
      
      const inserted = await query`
        INSERT INTO whitelisted_domains (domain, university, is_active)
        VALUES (${_formattedDomain}, ${university}, true)
        RETURNING id, domain, university, created_at, is_active
      `
      const row = inserted.rows[0]
      const newDomain = { id: row.id, domain: row.domain, university: row.university, createdAt: row.created_at, isActive: row.is_active }

      return NextResponse.json({ domain: newDomain })
    }

    if (action === 'update') {
      if (!_domainId) {
        return NextResponse.json({ error: 'domainId is required' }, { status: 400 })
      }
      const _formattedDomain = domain.startsWith('@') ? domain : `@${domain}`
      const updated = await query`
        UPDATE whitelisted_domains
        SET domain = ${_formattedDomain}, university = ${university}, updated_at = NOW()
        WHERE id = ${_domainId}
        RETURNING id, domain, university, created_at, is_active
      `
      const row = updated.rows?.[0]
      if (!row) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
      return NextResponse.json({
        domain: {
          id: row.id,
          domain: row.domain,
          university: row.university,
          createdAt: row.created_at,
          isActive: row.is_active,
        }
      })
    }

    if (action === 'toggle') {
      if (!_domainId || typeof _isActive !== 'boolean') {
        return NextResponse.json({ error: 'domainId and isActive required' }, { status: 400 })
      }
      const toggled = await query`
        UPDATE whitelisted_domains
        SET is_active = ${_isActive}, updated_at = NOW()
        WHERE id = ${_domainId}
        RETURNING id
      `
      if (toggled.rowCount === 0) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error managing domain:', error)
    return NextResponse.json({ error: 'Failed to manage domain' }, { status: 500 })
  }
}

// DELETE - Remove domain
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('id')

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID required' }, { status: 400 })
    }

    const deleted = await query`
      DELETE FROM whitelisted_domains WHERE id = ${domainId}
    `
    if (deleted.rowCount === 0) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting domain:', error)
    return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 })
  }
}