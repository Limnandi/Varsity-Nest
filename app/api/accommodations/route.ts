import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { getCurrentUserFromRequest } from '@/lib/auth-server'
import { fetchAccommodationsByProvider, insertAccommodation } from '@/lib/repos/accommodations'
import { OptimizedAccommodationRepository } from '@/lib/database-optimized'
import { searchSchema, accommodationCreateSchema, validateRequest } from '@/lib/validation-schemas'
import { ApiErrorResponseBuilder } from '@/lib/api-error-response'
import { ApiMiddleware } from '@/lib/api-middleware'

export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      
      // Validate search parameters
      const searchData = {
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
        status: searchParams.get('accreditation_status') || searchParams.get('status') || undefined,
        featured: searchParams.get('featured') === 'true' ? true : searchParams.get('featured') === 'false' ? false : undefined,
        providerId: searchParams.get('provider_id') || undefined,
        query: searchParams.get('query') || undefined,
        minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
        maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
        area: searchParams.get('area') || undefined,
        amenities: searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : undefined
      }
      
      const validation = validateRequest(searchSchema, searchData)
      if (!validation.success) {
        return await ApiErrorResponseBuilder.createValidationErrorResponse(
          validation.errors,
          request,
          { component: 'accommodations_get' }
        )
      }
      
      const { limit, offset, status, featured, providerId } = validation.data

      let accommodations
      if (providerId) {
        accommodations = await fetchAccommodationsByProvider(providerId, limit || 24)
      } else if (status) {
        accommodations = await OptimizedAccommodationRepository.getAccommodationsByStatus(status, limit || 24, offset || 0)
      } else if (featured === true) {
        accommodations = await OptimizedAccommodationRepository.getFeaturedAccommodations(limit || 24)
      } else {
        // Default: show only published & active accommodations
        accommodations = await OptimizedAccommodationRepository.getPublishedAccommodations(limit || 24, offset || 0)
      }

      return ApiMiddleware.createResponse(
        accommodations,
        "Accommodations retrieved successfully"
      )
    } catch (error) {
      return await ApiErrorResponseBuilder.createDatabaseErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        request,
        { component: 'accommodations_get' }
      )
    }
  },
  {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // 100 requests per window
    },
    cors: true,
    requestSizeCheck: false, // GET request
    validation: searchSchema
  }
)

export async function POST(request: NextRequest) {
  try {
    // Resolve current user from secure JWT or StackAuth fallback
    let user = await getCurrentUserFromRequest(request)
    if (!user) {
      const { getCurrentUserFromStackAuth } = await import('@/lib/auth-server')
      user = await getCurrentUserFromStackAuth()
    }

    if (!user || user.role !== 'provider') {
      console.error('[ACCOM POST] Unauthorized', { userId: user?.id, role: user?.role })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    console.log('[ACCOM POST] Content-Type:', contentType)
    let payload: any = {}
    let imagesToUpload: File[] = []

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      
      // Validate and sanitize form data
      const accRaw = String(form.get('accreditation_status') || 'accredited')
      const formData = {
        name: String(form.get('title') || form.get('name') || ''),
        address: String(form.get('address') || ''),
        description: String(form.get('description') || ''),
        price: Number(form.get('price') || 0),
        area: String(form.get('area') || ''),
        distance: form.get('distance') ? Number(form.get('distance')) : undefined,
        amenities: JSON.parse(String(form.get('amenities') || '[]')),
        accreditation_status: accRaw.includes('_') ? accRaw.replace('_', '-') : accRaw,
        featured: String(form.get('featured') || 'false') === 'true',
        available_rooms: Number(form.get('available_rooms') || 0),
        total_rooms: Number(form.get('total_rooms') || 0),
        is_verified: String(form.get('is_verified') || 'false') === 'true',
        has_single_rooms: String(form.get('has_single_rooms') || 'false') === 'true',
        has_sharing_rooms: String(form.get('has_sharing_rooms') || 'false') === 'true',
        single_room_price: Number(form.get('single_room_price') || 0),
        sharing_room_price: Number(form.get('sharing_room_price') || 0),
        // Additional optional fields present in DB
        contact_email: String(form.get('contact_email') || ''),
        contact_phone: String(form.get('contact_phone') || ''),
        website_url: String(form.get('website_url') || ''),
        city: String(form.get('city') || ''),
        province: String(form.get('province') || ''),
        postal_code: String(form.get('postal_code') || ''),
        accommodation_type: String(form.get('accommodation_type') || ''),
        max_occupancy: form.get('max_occupancy') ? Number(form.get('max_occupancy')) : undefined,
      }
      console.log('[ACCOM POST] Parsed formData summary:', {
        name: formData.name,
        price: formData.price,
        total_rooms: formData.total_rooms,
        available_rooms: formData.available_rooms,
        accreditation_status: formData.accreditation_status,
        has_single_rooms: formData.has_single_rooms,
        has_sharing_rooms: formData.has_sharing_rooms,
      })
      
      // For multipart, validate using a schema tailored to this form (files validated separately)
      const multipartSchema = accommodationCreateSchema
        .omit({ images: true })
        .extend({
          // Allow shorter descriptions for draft/internal listings
          description: (accommodationCreateSchema.shape as any).description.min(1, "Description required"),
          // Be permissive on name for provider-entered listings
          name: (accommodationCreateSchema.shape as any).name.max(200),
        })
      const validation = validateRequest(multipartSchema, formData)
      if (!validation.success) {
        console.error('[ACCOM POST] Validation errors:', validation.errors)
        return NextResponse.json(
          { error: 'Invalid form data', details: validation.errors },
          { status: 400 }
        )
      }
      
      payload = validation.data
      
      // Use secure file upload middleware
      const { FileUploadMiddleware } = await import('@/lib/middleware/file-upload')
      const fileResult = await FileUploadMiddleware.processFormData(form, request, {
        purpose: 'accommodation',
        maxFiles: 11
      })
      console.log('[ACCOM POST] File middleware result:', {
        files: fileResult.files?.length || 0,
        errors: fileResult.errors,
        warnings: fileResult.warnings,
        quarantined: fileResult.quarantinedFiles?.length || 0,
      })

      if (fileResult.errors.length > 0) {
        return NextResponse.json({ 
          error: 'File upload validation failed', 
          details: fileResult.errors,
          warnings: fileResult.warnings 
        }, { status: 400 })
      }

      if (fileResult.quarantinedFiles.length > 0) {
        return NextResponse.json({ 
          error: 'Some files were quarantined for security reasons', 
          quarantined: fileResult.quarantinedFiles,
          warnings: fileResult.warnings 
        }, { status: 400 })
      }

      imagesToUpload = fileResult.files
    } else {
      const raw = await request.json()
      // Normalize JSON body to match schema expectations
      const accRaw = String(raw.accreditation_status || 'accredited')
      const jsonData = {
        ...raw,
        price: Number(raw.price || 0),
        total_rooms: Number(raw.total_rooms || 0),
        available_rooms: Number(raw.available_rooms ?? 0),
        single_room_price: raw.single_room_price != null ? Number(raw.single_room_price) : undefined,
        sharing_room_price: raw.sharing_room_price != null ? Number(raw.sharing_room_price) : undefined,
        distance: raw.distance != null ? Number(raw.distance) : undefined,
        accreditation_status: accRaw.includes('_') ? accRaw.replace('_', '-') : accRaw,
      }

      // Relax description/name like multipart path
      const jsonSchema = accommodationCreateSchema
        .extend({
          description: (accommodationCreateSchema.shape as any).description.min(1, 'Description required'),
          name: (accommodationCreateSchema.shape as any).name.max(200),
        })

      const validation = validateRequest(jsonSchema, jsonData)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid JSON data', details: validation.errors },
          { status: 400 }
        )
      }

      payload = validation.data
      // JSON path already contains URLs; no File[] uploads here
      imagesToUpload = []
    }

    const uploadedImages: string[] = []
    const uploadWarnings: string[] = []
    
    for (const file of imagesToUpload) {
      try {
        const { uploadImageSecurely } = await import('@/lib/cloudinary')
        const result = await uploadImageSecurely(file, {
          folder: 'varsity-nest/accommodations',
          purpose: 'accommodation',
          userId: user.id,
          generateThumbnails: true,
          compressImages: true
        })
        
        if (result.success && result.result?.secure_url) {
          uploadedImages.push(result.result.secure_url)
          if (result.warnings) {
            uploadWarnings.push(...result.warnings)
          }
        } else {
          console.error('Image upload failed:', result.error)
          // Continue with other images even if one fails
        }
      } catch (error) {
        console.error('Image upload error:', error)
        // Continue with other images even if one fails
      }
    }
    console.log('[ACCOM POST] Uploaded image count:', uploadedImages.length)

    // Resolve providerId from providers table for this user
    const providerIdResult = await query`
      SELECT id FROM providers WHERE user_id = ${user.id} LIMIT 1
    `

    if (providerIdResult.rows.length === 0) {
      console.error('[ACCOM POST] Provider profile not found for user', user.id)
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 })
    }

    const record = await insertAccommodation({
      name: payload.name,
      description: payload.description,
      address: payload.address,
      price: Number(payload.price) || 0,
      amenities: payload.amenities || [],
      images: uploadedImages,
      accreditation_status: (payload.accreditation_status as string)?.replace('-', '_') || 'accredited',
      provider_id: providerIdResult.rows[0].id,
      area: payload.area || null,
      distance: payload.distance || null,
      featured: Boolean(payload.featured),
      available_rooms: payload.available_rooms ?? 0,
      total_rooms: payload.total_rooms ?? 0,
      is_verified: Boolean(payload.is_verified),
      has_single_rooms: Boolean(payload.has_single_rooms),
      has_sharing_rooms: Boolean(payload.has_sharing_rooms),
      single_room_price: Number(payload.single_room_price) || 0,
      sharing_room_price: Number(payload.sharing_room_price) || 0,
      listing_status: 'draft',
      is_published: false,
      contact_email: payload.contact_email || undefined,
      contact_phone: payload.contact_phone || undefined,
      website_url: payload.website_url || undefined,
      city: payload.city || undefined,
      province: payload.province || undefined,
      postal_code: payload.postal_code || undefined,
      accommodation_type: payload.accommodation_type || undefined,
      max_occupancy: payload.max_occupancy || undefined,
    })
    console.log('[ACCOM POST] Inserted accommodation id:', record.id)

    // Set card_image_url to the first uploaded image if the column exists
    try {
      if (uploadedImages.length > 0) {
        const { query } = await import('@/lib/database')
        await query`UPDATE accommodations SET card_image_url = ${uploadedImages[0]} WHERE id = ${record.id}`
      }
    } catch (e) {
      console.warn('[ACCOM POST] Unable to set card_image_url (column may not exist):', e)
    }

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[ACCOM POST] Unhandled error:', error)
    return ApiErrorResponseBuilder.createDatabaseErrorResponse(
      error instanceof Error ? error : new Error(String(error)),
      request,
      { component: 'accommodations_post' }
    )
  }
}


