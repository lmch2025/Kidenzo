import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/user/upgrade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (existingUser.role !== 'recommender') {
      return NextResponse.json(
        { error: 'User is not a recommender or is already an ambassador/owner' },
        { status: 400 }
      )
    }

    // Upgrade role
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        role: 'ambassador',
      },
    })

    // Return user without pinHash
    const { pinHash: _, ...userWithoutPin } = updatedUser

    return NextResponse.json(
      {
        user: userWithoutPin,
        message: 'Successfully upgraded to ambassador',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Upgrade role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
