import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/stackauth"
import { postgrest } from "@/lib/postgrest"

// GET - Fetch all whitelisted domains
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const domainsRows = await postgrest.get<any>('whitelisted_domains', { order: 'created_at.desc' })
    const domains = domainsRows.map((row: any) => ({
      id: row.id,
      domain: row.domain,
      university: row.university,
      createdAt: row.created_at,
      isActive: row.is_active
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
    const { action, domain, university, domainId, isActive } = body

    if (action === 'add') {
      // Add new domain
      const formattedDomain = domain.startsWith('@') ? domain : `@${domain}`
      
      const inserted = await postgrest.post<any>('whitelisted_domains', {
        domain: formattedDomain,
        university,
        is_active: true
      })

      const newDomain = {
        id: inserted.id,
        domain: inserted.domain,
        university: inserted.university,
        createdAt: inserted.created_at,
        isActive: inserted.is_active
      }

      return NextResponse.json({ domain: newDomain })
    }

    if (action === 'update') {
      // Update existing domain
      const formattedDomain = domain.startsWith('@') ? domain : `@${domain}`
      
      await postgrest.put('whitelisted_domains', {
        domain: formattedDomain,
        university
      }, { id: domainId as any })

      return NextResponse.json({ success: true })
    }

    if (action === 'toggle') {
      // Toggle domain status
      await postgrest.put('whitelisted_domains', {
        is_active: Boolean(isActive)
      }, { id: domainId as any })

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

    await postgrest.delete('whitelisted_domains', { id: domainId as any })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting domain:', error)
    return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 })
  }
}