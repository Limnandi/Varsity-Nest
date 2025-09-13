import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest } from '@/lib/auth-server'
import { uploadImage } from '@/lib/cloudinary'
import { fetchAccommodationsByStatus, fetchAccommodationsByProvider, insertAccommodation } from '@/lib/repos/accommodations'
import { OptimizedAccommodationRepository } from '@/lib/database-optimized'
import { searchSchema, accommodationCreateSchema, validateRequest } from '@/lib/validation-schemas'
import { createSecurityMiddleware } from '@/lib/validation-middleware'
import { ApiErrorResponseBuilder, ErrorCodes } from '@/lib/api-error-response'
import { GlobalErrorHandler } from '@/lib/error-handler'
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
        accommodations = await fetchAccommodationsByProvider(providerId, limit || 50)
      } else if (status) {
        accommodations = await OptimizedAccommodationRepository.getAccommodationsByStatus(status, limit || 50, offset || 0)
      } else if (featured === true) {
        accommodations = await OptimizedAccommodationRepository.getFeaturedAccommodations(limit || 50)
      } else {
        accommodations = await OptimizedAccommodationRepository.getAccommodationsByStatus('accredited', limit || 50, offset || 0)
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
    const user = await getCurrentUserFromRequest(request)
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let payload: any = {}
    let imagesToUpload: File[] = []

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      
      // Validate and sanitize form data
      const formData = {
        name: String(form.get('title') || form.get('name') || ''),
        address: String(form.get('address') || ''),
        description: String(form.get('description') || ''),
        price: Number(form.get('price') || 0),
        area: String(form.get('area') || ''),
        distance: form.get('distance') ? Number(form.get('distance')) : undefined,
        amenities: JSON.parse(String(form.get('amenities') || '[]')),
        accreditationStatus: String(form.get('accreditation_status') || 'accredited'),
        featured: String(form.get('featured') || 'false') === 'true',
        available_rooms: Number(form.get('available_rooms') || 0),
        total_rooms: Number(form.get('total_rooms') || 0),
        is_verified: String(form.get('is_verified') || 'false') === 'true',
      }
      
      // Validate the form data
      const validation = validateRequest(accommodationCreateSchema, formData)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid form data', details: validation.errors },
          { status: 400 }
        )
      }
      
      payload = validation.data
      
      // Use secure file upload middleware
      const { FileUploadMiddleware } = await import('@/lib/middleware/file-upload')
      const fileResult = await FileUploadMiddleware.processFileUploads(request, {
        purpose: 'accommodation',
        maxFiles: 10
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
      const jsonData = await request.json()
      
      // Validate JSON data
      const validation = validateRequest(accommodationCreateSchema, jsonData)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid JSON data', details: validation.errors },
          { status: 400 }
        )
      }
      
      payload = validation.data
      imagesToUpload = (payload.images as File[]) || []
    }

    const uploadedImages: string[] = []
    const uploadWarnings: string[] = []
    
    for (const file of imagesToUpload) {
      try {
        const { uploadImageSecurely } = await import('@/lib/cloudinary')
        const result = await uploadImageSecurely(file, {
          folder: 'varsity-nest/accommodations',
          purpose: 'accommodation',
          userId: 'unknown', // This should be extracted from session
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

    const record = await insertAccommodation({
      name: payload.name,
      description: payload.description,
      address: payload.address,
      price: Number(payload.price) || 0,
      amenities: payload.amenities || [],
      images: uploadedImages,
      accreditation_status: payload.accreditation_status || 'accredited',
      provider_id: user.id,
      area: payload.area || null,
      distance: payload.distance || null,
      featured: Boolean(payload.featured),
      available_rooms: payload.available_rooms ?? 0,
      total_rooms: payload.total_rooms ?? 0,
      is_verified: Boolean(payload.is_verified),
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    return ApiErrorResponseBuilder.createDatabaseErrorResponse(
      error instanceof Error ? error : new Error(String(error)),
      request,
      { component: 'accommodations_post' }
    )
  }
}


