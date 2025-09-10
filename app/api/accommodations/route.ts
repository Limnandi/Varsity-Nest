import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest } from '@/lib/auth-server'
import { uploadImage } from '@/lib/cloudinary'
import { fetchAccommodationsByStatus, fetchAccommodationsByProvider, insertAccommodation } from '@/lib/repos/accommodations'
import { searchSchema, accommodationCreateSchema, validateRequest } from '@/lib/validation-schemas'
import { createSecurityMiddleware } from '@/lib/validation-middleware'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate search parameters
    const searchData = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      status: searchParams.get('accreditation_status') || undefined,
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
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validation.errors },
        { status: 400 }
      )
    }
    
    const { limit, offset, status, featured, providerId } = validation.data

    let accommodations
    if (providerId) {
      accommodations = await fetchAccommodationsByProvider(providerId, limit || 50)
    } else if (status) {
      accommodations = await fetchAccommodationsByStatus(status, limit || 50, offset || 0)
    } else if (featured === true) {
      const { fetchFeaturedAccommodations } = await import('@/lib/repos/accommodations')
      accommodations = await fetchFeaturedAccommodations(limit || 50)
    } else {
      accommodations = await fetchAccommodationsByStatus('accredited', limit || 50, offset || 0)
    }

    return NextResponse.json(accommodations)
  } catch (error) {
    console.error('Error fetching accommodations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accommodations' },
      { status: 500 }
    )
  }
}

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
        accreditation_status: String(form.get('accreditation_status') || 'accredited'),
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
      
      const files = (form.getAll('images') as unknown as File[]) || []
      // Validate images: max 10, max 10MB each, allowed types
      const MAX_FILES = 10
      const MAX_SIZE = 10 * 1024 * 1024
      const ALLOWED = ['image/jpeg','image/png','image/webp']
      if (files.length > MAX_FILES) {
        return NextResponse.json({ error: `Max ${MAX_FILES} images allowed` }, { status: 400 })
      }
      for (const f of files) {
        const type = (f as any).type as string | undefined
        const size = (f as any).size as number | undefined
        if (!type || !ALLOWED.includes(type)) {
          return NextResponse.json({ error: 'Only JPEG, PNG, WEBP images allowed' }, { status: 400 })
        }
        if (!size || size > MAX_SIZE) {
          return NextResponse.json({ error: 'Each image must be <= 10MB' }, { status: 400 })
        }
      }
      imagesToUpload = files
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
    for (const file of imagesToUpload) {
      const result: any = await uploadImage(file, 'varsity-nest/accommodations')
      if (result?.secure_url) uploadedImages.push(result.secure_url)
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
    console.error('Error creating accommodation:', error)
    return NextResponse.json(
      { error: 'Failed to create accommodation' },
      { status: 500 }
    )
  }
}


