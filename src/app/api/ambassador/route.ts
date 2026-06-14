import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ambassador - Get ambassador's network or stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action') // 'network' or 'stats'

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify user is an ambassador
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'ambassador') {
      return NextResponse.json(
        { error: 'User is not an ambassador' },
        { status: 403 }
      )
    }

    if (action === 'stats') {
      return await handleGetStats(userId)
    }

    // Default: return network
    return await handleGetNetwork(userId)
  } catch (error) {
    console.error('Ambassador GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleGetNetwork(ambassadorId: string) {
  // Get all recommenders under this ambassador with their stats
  const recommenders = await db.user.findMany({
    where: { ambassadorId },
    select: {
      id: true,
      name: true,
      phone: true,
      xp: true,
      level: true,
      streak: true,
      createdAt: true,
      _count: {
        select: {
          recommenderProducts: true,
          ordersAsRecommender: true,
        },
      },
      ordersAsRecommender: {
        where: { status: 'delivered' },
        select: {
          finalPrice: true,
          commissionRecommender: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate stats per recommender
  const network = recommenders.map((rec) => {
    const totalSales = rec.ordersAsRecommender.reduce(
      (sum, order) => sum + order.finalPrice,
      0
    )
    const totalCommissions = rec.ordersAsRecommender.reduce(
      (sum, order) => sum + order.commissionRecommender,
      0
    )

    return {
      id: rec.id,
      name: rec.name,
      phone: rec.phone,
      xp: rec.xp,
      level: rec.level,
      streak: rec.streak,
      joinedAt: rec.createdAt,
      totalProducts: rec._count.recommenderProducts,
      totalOrders: rec._count.ordersAsRecommender,
      totalSales,
      totalCommissions,
    }
  })

  return NextResponse.json({ network })
}

async function handleGetStats(ambassadorId: string) {
  // Total recommenders
  const totalRecommenders = await db.user.count({
    where: { ambassadorId },
  })

  // Total sales from network (delivered orders)
  const deliveredOrders = await db.order.findMany({
    where: {
      status: 'delivered',
      recommender: { ambassadorId },
    },
    select: {
      finalPrice: true,
      commissionAmbassador: true,
      commissionRecommender: true,
    },
  })

  const totalSales = deliveredOrders.reduce(
    (sum, order) => sum + order.finalPrice,
    0
  )

  const totalCommissions = deliveredOrders.reduce(
    (sum, order) => sum + order.commissionAmbassador,
    0
  )

  // Total orders count
  const totalOrders = deliveredOrders.length

  // Recent orders (last 10)
  const recentOrders = await db.order.findMany({
    where: {
      recommender: { ambassadorId },
    },
    include: {
      recommender: {
        select: { id: true, name: true, phone: true },
      },
      miniSite: {
        include: {
          product: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return NextResponse.json({
    totalRecommenders,
    totalSales,
    totalCommissions,
    totalOrders,
    recentOrders,
  })
}
