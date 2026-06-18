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

    if (!['ambassador', 'super_admin', 'admin', 'owner'].includes(user.role)) {
      return NextResponse.json(
        { error: 'User is not an ambassador or admin' },
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
  // Get all recommenders under this ambassador with basic info
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
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get aggregated stats per recommender using groupBy
  const orderStats = await db.order.groupBy({
    by: ['recommenderId'],
    where: {
      status: 'delivered',
      recommender: { ambassadorId },
    },
    _sum: {
      finalPrice: true,
      commissionRecommender: true,
    },
  })

  // Create a lookup map for faster access
  const statsMap = new Map(
    orderStats.map((stat) => [
      stat.recommenderId,
      {
        totalSales: stat._sum.finalPrice || 0,
        totalCommissions: stat._sum.commissionRecommender || 0,
      },
    ])
  )

  // Calculate stats per recommender
  const network = recommenders.map((rec) => {
    const stats = statsMap.get(rec.id) || { totalSales: 0, totalCommissions: 0 }

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
      totalSales: stats.totalSales,
      totalCommissions: stats.totalCommissions,
    }
  })

  return NextResponse.json({ network })
}

async function handleGetStats(ambassadorId: string) {
  // Execute aggregations concurrently for better performance
  const [totalRecommenders, orderStats, recentOrders] = await Promise.all([
    db.user.count({
      where: { ambassadorId },
    }),
    db.order.aggregate({
      where: {
        status: 'delivered',
        recommender: { ambassadorId },
      },
      _sum: {
        finalPrice: true,
        commissionAmbassador: true,
      },
      _count: true,
    }),
    db.order.findMany({
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
    }),
  ])

  return NextResponse.json({
    totalRecommenders,
    totalSales: orderStats._sum.finalPrice || 0,
    totalCommissions: orderStats._sum.commissionAmbassador || 0,
    totalOrders: orderStats._count || 0,
    recentOrders,
  })
}
