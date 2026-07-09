import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/user - Get fresh user data by ID (passed as token for demo)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: token },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { pinHash: _, ...userWithoutPin } = user

    return NextResponse.json({ user: userWithoutPin })
  } catch (error) {
    console.error('User GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
