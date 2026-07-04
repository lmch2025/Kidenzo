import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, endpoint, p256dh, auth } = body

    if (action === 'subscribe') {
      if (!userId || !endpoint || !p256dh || !auth) {
        return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 })
      }

      const subscription = await db.pushSubscription.upsert({
        where: { endpoint },
        update: { userId, p256dh, auth },
        create: { userId, endpoint, p256dh, auth }
      })

      return NextResponse.json(subscription, { status: 201 })
    }

    if (action === 'unsubscribe') {
      if (!endpoint) {
        return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
      }

      await db.pushSubscription.deleteMany({
        where: { endpoint }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Push POST error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
