import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/auth - Login or Register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, pin, confirmPin, name } = body

    if (!phone || !pin) {
      return NextResponse.json(
        { error: 'Phone and PIN are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { phone },
    })

    if (existingUser) {
      // Login: compare PIN directly (demo - pin stored in pinHash field)
      if (pin !== existingUser.pinHash) {
        return NextResponse.json(
          { error: 'Invalid PIN' },
          { status: 401 }
        )
      }

      // Update lastActiveAt and streak
      const now = new Date()
      const lastActive = existingUser.lastActiveAt
      const diffMs = now.getTime() - lastActive.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      let newStreak = existingUser.streak
      if (diffDays === 1) {
        // Consecutive day - increment streak
        newStreak += 1
      } else if (diffDays > 1) {
        // Streak broken - reset to 1
        newStreak = 1
      }
      // Same day: keep current streak

      const updatedUser = await db.user.update({
        where: { id: existingUser.id },
        data: {
          lastActiveAt: now,
          streak: newStreak,
        },
      })

      // Return user without pinHash + demo token
      const { pinHash: _, ...userWithoutPin } = updatedUser
      return NextResponse.json({
        user: userWithoutPin,
        token: existingUser.id, // Demo: use user ID as token
      })
    }

    // Register new user
    if (!confirmPin) {
      return NextResponse.json(
        { error: 'confirmPin is required for registration' },
        { status: 400 }
      )
    }

    if (pin !== confirmPin) {
      return NextResponse.json(
        { error: 'PINs do not match' },
        { status: 400 }
      )
    }

    if (pin.length < 4) {
      return NextResponse.json(
        { error: 'PIN must be at least 4 digits' },
        { status: 400 }
      )
    }

    const newUser = await db.user.create({
      data: {
        phone,
        pinHash: pin, // Demo: store PIN directly in pinHash
        name: name || null,
        role: 'recommender',
        streak: 1,
        lastActiveAt: new Date(),
      },
    })

    // Return user without pinHash + demo token
    const { pinHash: __, ...userWithoutPin } = newUser
    return NextResponse.json(
      {
        user: userWithoutPin,
        token: newUser.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
