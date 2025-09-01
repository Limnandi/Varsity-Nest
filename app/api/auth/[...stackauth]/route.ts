import { NextRequest, NextResponse } from 'next/server'
import { signIn, signOut } from '@/lib/stackauth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...credentials } = body

    if (action === 'signin') {
      const result = await signIn(credentials)
      if (result.success) {
        return NextResponse.json(result)
      } else {
        return NextResponse.json(result, { status: 401 })
      }
    }

    if (action === 'signout') {
      const result = await signOut()
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Auth endpoint ready' })
}
