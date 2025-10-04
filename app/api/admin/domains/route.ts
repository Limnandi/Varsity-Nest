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

    // TODO: whitelisted_domains table doesn't exist in schema
    // This functionality needs to be implemented properly
    return NextResponse.json({ 
      error: 'Whitelisted domains functionality not implemented yet',
      domains: [] 
    }, { status: 501 })
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
      // TODO: whitelisted_domains table doesn't exist in schema
      return NextResponse.json({ 
        error: 'Whitelisted domains functionality not implemented yet' 
      }, { status: 501 })
    }

    if (action === 'toggle') {
      // TODO: whitelisted_domains table doesn't exist in schema
      return NextResponse.json({ 
        error: 'Whitelisted domains functionality not implemented yet' 
      }, { status: 501 })
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

    // TODO: whitelisted_domains table doesn't exist in schema
    return NextResponse.json({ 
      error: 'Whitelisted domains functionality not implemented yet' 
    }, { status: 501 })
  } catch (error) {
    console.error('Error deleting domain:', error)
    return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 })
  }
}