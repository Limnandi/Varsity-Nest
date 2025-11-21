import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/stackauth'
import { secureDb } from '@/lib/database-secure'
import { query } from '@/lib/database'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/schema'
import { accommodationUpdateSchema, validateRequest } from '@/lib/validation-schemas'
import { deleteImages } from '@/lib/cloudinary'
import { invalidateAccommodationsCache } from '@/lib/cache/accommodations-cache'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    
    const [accommodation] = await secureDb.db
      .select()
      .from(schema.accommodations)
      .where(eq(schema.accommodations.id, id))
      .limit(1)
    
    if (!accommodation) {
      return NextResponse.json({ error: 'Accommodation not found' }, { status: 404 })
    }

    // Check if user is provider/owner or admin - they can see inactive properties
    const isOwnerOrAdmin = user && (user.role === 'provider' || user.role === 'admin')
    
    if (isOwnerOrAdmin && user.role === 'provider') {
      const providerResult = await query`
        SELECT id FROM providers WHERE user_id = ${user.id} LIMIT 1
      `
      
      if (providerResult.rows.length === 0) {
        return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
      }
      
      const providerId = providerResult.rows[0].id
      
      if (accommodation.providerId !== providerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      // Provider can see their own properties regardless of status
      return NextResponse.json(accommodation)
    }

    // For non-owners/admins: block inactive or unpublished accommodations
    if (!isOwnerOrAdmin) {
      const isActive = accommodation.isActive !== false
      const isPublished = (accommodation as any).isPublished !== false
      
      if (!isActive || !isPublished) {
        // Return 404 to hide existence of inactive properties
        return NextResponse.json({ error: 'Accommodation not found' }, { status: 404 })
      }
    }

    return NextResponse.json(accommodation)
  } catch (error) {
    console.error('Get accommodation error:', error)
    return NextResponse.json({ error: 'Failed to fetch accommodation' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const validation = validateRequest(accommodationUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: validation.errors },
        { status: 400 }
      )
    }

    const providerResult = await query`
      SELECT id FROM providers WHERE user_id = ${user.id} LIMIT 1
    `
    
    if (providerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
    }
    
    const providerId = providerResult.rows[0].id

    const [existingAccommodation] = await secureDb.db
      .select({ 
        providerId: schema.accommodations.providerId,
        images: schema.accommodations.images
      })
      .from(schema.accommodations)
      .where(eq(schema.accommodations.id, id))
      .limit(1)
    
    if (!existingAccommodation || existingAccommodation.providerId !== providerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData = validation.data

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const existingImages = Array.isArray(existingAccommodation.images) 
      ? (existingAccommodation.images as string[]) 
      : []
    
    const existingCardImage = (existingAccommodation as any).card_image_url || (existingImages.length > 0 ? existingImages[0] : null)
    
    const newImages = updateData.images && Array.isArray(updateData.images) 
      ? (updateData.images as string[]) 
      : undefined

    const newCardImage = (updateData as any).card_image_url

    if (newImages !== undefined) {
      const propertyImagesToDelete = existingImages
        .filter((img, idx) => {
          if (existingCardImage && img === existingCardImage && idx === 0) {
            return false
          }
          return !newImages.includes(img)
        })
      
      if (propertyImagesToDelete.length > 0) {
        const deleteResult = await deleteImages(propertyImagesToDelete)
        if (!deleteResult.success) {
          console.warn('Failed to delete removed images from Cloudinary:', deleteResult.error)
        }
      }
    }

    if (newCardImage && existingCardImage && newCardImage !== existingCardImage) {
      const deleteResult = await deleteImages([existingCardImage])
      if (!deleteResult.success) {
        console.warn('Failed to delete old card image from Cloudinary:', deleteResult.error)
      }
    }

    if ((updateData as any).card_image_url) {
      try {
        await query`UPDATE accommodations SET card_image_url = ${(updateData as any).card_image_url} WHERE id = ${id}`
      } catch (e) {
        console.warn('Unable to update card_image_url (column may not exist):', e)
      }
    }

    const [updated] = await secureDb.db
      .update(schema.accommodations)
      .set(updateData)
      .where(eq(schema.accommodations.id, id))
      .returning()

    await invalidateAccommodationsCache()
    
    return NextResponse.json(updated || null)
  } catch (error) {
    console.error('Update accommodation error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    const providerResult = await query`
      SELECT id FROM providers WHERE user_id = ${user.id} LIMIT 1
    `
    
    if (providerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
    }
    
    const providerId = providerResult.rows[0].id
    
    const [existingAccommodation] = await secureDb.db
      .select({ 
        providerId: schema.accommodations.providerId,
        images: schema.accommodations.images
      })
      .from(schema.accommodations)
      .where(eq(schema.accommodations.id, id))
      .limit(1)
    
    if (!existingAccommodation || existingAccommodation.providerId !== providerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existingImages = Array.isArray(existingAccommodation.images) 
      ? (existingAccommodation.images as string[]) 
      : []

    if (existingImages.length > 0) {
      const deleteResult = await deleteImages(existingImages)
      if (!deleteResult.success) {
        console.warn('Failed to delete accommodation images from Cloudinary:', deleteResult.error)
      }
    }

    await secureDb.db
      .delete(schema.accommodations)
      .where(eq(schema.accommodations.id, id))
    
    await invalidateAccommodationsCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete accommodation error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}


