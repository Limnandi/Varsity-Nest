import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getAdminSettings, updateAdminSettings } from '@/lib/stackauth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getAdminSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = await updateAdminSettings(body)
    
    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error updating admin settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}