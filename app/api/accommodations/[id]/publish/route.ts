import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest } from '@/lib/auth-server'
import { secureDb } from '@/lib/database-secure'
import { eq, and } from 'drizzle-orm'
import * as schema from '@/lib/schema'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { is_published } = await request.json()

    if (typeof is_published !== 'boolean') {
      return NextResponse.json({ error: 'Invalid is_published value' }, { status: 400 })
    }

    // Verify the accommodation belongs to the provider
    const accommodation = await secureDb.db
      .select()
      .from(schema.accommodations)
      .where(and(
        eq(schema.accommodations.id, id),
        eq(schema.accommodations.providerId, user.id)
      ))
      .limit(1)

    if (accommodation.length === 0) {
      return NextResponse.json({ error: 'Accommodation not found or not owned by provider' }, { status: 404 })
    }

    // Update the accommodation
    const [updatedAccommodation] = await secureDb.db
      .update(schema.accommodations)
      .set({
        isPublished: is_published,
        listingStatus: is_published ? 'published' : 'unpublished',
        publishedAt: is_published ? new Date() : null,
        unpublishedAt: !is_published ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(schema.accommodations.id, id))
      .returning()

    return NextResponse.json({
      id: updatedAccommodation.id,
      is_published: updatedAccommodation.isPublished,
      listing_status: updatedAccommodation.listingStatus,
      published_at: updatedAccommodation.publishedAt,
      unpublished_at: updatedAccommodation.unpublishedAt
    })
  } catch (error) {
    console.error('Error updating accommodation publication status:', error)
    return NextResponse.json(
      { error: 'Failed to update accommodation publication status' },
      { status: 500 }
    )
  }
}
