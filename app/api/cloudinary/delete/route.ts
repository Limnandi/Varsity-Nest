import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/stackauth'
import { deleteImages, extractPublicIdFromUrl } from '@/lib/cloudinary'
import { z } from 'zod'

const deleteImageSchema = z.object({
  publicIds: z.array(z.string()).optional(),
  publicId: z.string().optional(),
  urls: z.array(z.string()).optional(),
  url: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validation = deleteImageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { publicIds, publicId, urls, url } = validation.data

    let idsToDelete: string[] = []

    if (publicIds && publicIds.length > 0) {
      idsToDelete = publicIds.map(id => extractPublicIdFromUrl(id))
    } else if (publicId) {
      idsToDelete = [extractPublicIdFromUrl(publicId)]
    } else if (urls && urls.length > 0) {
      idsToDelete = urls.map(url => extractPublicIdFromUrl(url))
    } else if (url) {
      idsToDelete = [extractPublicIdFromUrl(url)]
    } else {
      return NextResponse.json({ error: 'No public IDs or URLs provided' }, { status: 400 })
    }

    const filteredIds = idsToDelete.filter(id => id && id.length > 0)

    if (filteredIds.length === 0) {
      return NextResponse.json({ error: 'No valid public IDs found' }, { status: 400 })
    }

    const result = await deleteImages(filteredIds)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete images' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      result: result.result,
      deleted: filteredIds
    })
  } catch (error) {
    console.error('Cloudinary delete API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete images' },
      { status: 500 }
    )
  }
}

