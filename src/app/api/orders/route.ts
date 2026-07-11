import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/orders - List orders (filter by recommenderId or ownerId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recommenderId = searchParams.get('recommenderId')
    const ownerId = searchParams.get('ownerId')

    const where: any = {}

    if (recommenderId) {
      where.recommenderId = recommenderId
    }

    if (ownerId) {
      // Find orders for products owned by this user
      where.miniSite = {
        product: {
          ownerId,
        },
      }
    }

    const orders = await db.order.findMany({
      where,
      include: {
        miniSite: {
          include: {
            product: {
              include: {
                owner: {
                  select: { id: true, name: true, phone: true, role: true },
                },
              },
            },
          },
        },
        recommender: {
          select: { id: true, name: true, phone: true, role: true },
        },
        commissionPayments: {
          include: {
            beneficiary: {
              select: { id: true, name: true, phone: true, role: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create order from mini-site
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      miniSiteId,
      recommenderId,
      customerName,
      customerPhone,
      customerAddress,
      customerMessage,
      finalPrice,
    } = body

    if (!miniSiteId || !customerName || !customerPhone || !customerAddress || finalPrice === undefined) {
      return NextResponse.json(
        { error: 'miniSiteId, customerName, customerPhone, customerAddress, and finalPrice are required' },
        { status: 400 }
      )
    }

    // Verify mini-site and get product info
    const miniSite = await db.miniSite.findUnique({
      where: { id: miniSiteId },
      include: {
        product: {
          include: {
            owner: true,
          },
        },
      },
    })

    if (!miniSite) {
      return NextResponse.json(
        { error: 'Mini-site not found' },
        { status: 404 }
      )
    }

    // Calculate commissions
    let commissionRecommender = 0
    let commissionAmbassador = 0
    let recommenderCommissionPct = 0

    if (recommenderId) {
      // Get the recommender's commission for this mini-site
      let recommenderProduct = await db.recommenderProduct.findUnique({
        where: {
          recommenderId_miniSiteId: {
            recommenderId,
            miniSiteId,
          },
        },
      })

      if (!recommenderProduct && miniSite.product) {
        // Auto-add to their boutique with max commission
        recommenderProduct = await db.recommenderProduct.create({
          data: {
            recommenderId,
            miniSiteId,
            commissionPct: miniSite.product.maxCommission,
          }
        })
      }

      if (recommenderProduct) {
        recommenderCommissionPct = recommenderProduct.commissionPct
        commissionRecommender = finalPrice * recommenderCommissionPct / 100
      }

      // Check if recommender has an ambassador
      const recommender = await db.user.findUnique({
        where: { id: recommenderId },
      })

      if (recommender?.ambassadorId) {
        // Ambassador gets 5% of final price
        commissionAmbassador = finalPrice * 0.05
      }
    }

    // Create the order
    const order = await db.order.create({
      data: {
        miniSiteId,
        recommenderId: recommenderId || null,
        customerName,
        customerPhone,
        customerAddress,
        customerMessage: customerMessage || null,
        finalPrice: parseFloat(String(finalPrice)),
        commissionRecommender,
        commissionAmbassador,
        status: 'pending',
      },
      include: {
        miniSite: {
          include: {
            product: {
              include: {
                owner: {
                  select: { id: true, name: true, phone: true, role: true },
                },
              },
            },
          },
        },
        recommender: {
          select: { id: true, name: true, phone: true, role: true },
        },
      },
    })

    // Award XP to recommender (100 per order)
    if (recommenderId) {
      const recommender = await db.user.findUnique({
        where: { id: recommenderId },
      })
      if (recommender) {
        const newXP = recommender.xp + 100
        const newLevel = Math.floor(newXP / 500) + 1
        await db.user.update({
          where: { id: recommenderId },
          data: {
            xp: newXP,
            level: newLevel,
          },
        })
      }
    }

    // Decrement product stock if applicable
    if (miniSite.product.stock > 0) {
      await db.product.update({
        where: { id: miniSite.product.id },
        data: { stock: { decrement: 1 } },
      })
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Orders POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/orders - Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const existing = await db.order.findUnique({
      where: { id },
      include: {
        recommender: true,
        miniSite: {
          include: { product: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = await db.order.update({
      where: { id },
      data: { status },
      include: {
        miniSite: {
          include: {
            product: {
              include: {
                owner: {
                  select: { id: true, name: true, phone: true, role: true },
                },
              },
            },
          },
        },
        recommender: {
          select: { id: true, name: true, phone: true, role: true },
        },
        commissionPayments: {
          include: {
            beneficiary: {
              select: { id: true, name: true, phone: true, role: true },
            },
          },
        },
      },
    })

    // When status becomes "delivered", process commissions and check achievements
    if (status === 'delivered') {
      // Create commission payments if they haven't been created yet
      const existingPayments = await db.commissionPayment.findMany({
        where: { orderId: id },
      })

      if (existingPayments.length === 0) {
        // Pay recommender commission
        if (order.commissionRecommender > 0 && order.recommenderId) {
          await db.commissionPayment.create({
            data: {
              orderId: id,
              beneficiaryId: order.recommenderId,
              amount: order.commissionRecommender,
            },
          })
        }

        // Pay ambassador commission
        if (order.commissionAmbassador > 0 && order.recommenderId) {
          const recommender = await db.user.findUnique({
            where: { id: order.recommenderId },
          })
          if (recommender?.ambassadorId) {
            await db.commissionPayment.create({
              data: {
                orderId: id,
                beneficiaryId: recommender.ambassadorId,
                amount: order.commissionAmbassador,
              },
            })
          }
        }
      }

      // Check and award badges/achievements for the recommender
      if (order.recommenderId) {
        await checkAndAwardAchievements(order.recommenderId)
      }
    }

    // If cancelled, restore stock
    if (status === 'cancelled' && existing.status !== 'cancelled' && existing.miniSite) {
      await db.product.update({
        where: { id: existing.miniSite.product.id },
        data: { stock: { increment: 1 } },
      })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Orders PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper: Check and award achievements for a user
async function checkAndAwardAchievements(userId: string) {
  // Count delivered orders for this recommender
  const deliveredOrders = await db.order.count({
    where: {
      recommenderId: userId,
      status: 'delivered',
    },
  })

  // Get all achievements
  const achievements = await db.achievement.findMany()

  // Get user's current achievements
  const userAchievements = await db.userAchievement.findMany({
    where: { userId },
  })

  const earnedIds = new Set(userAchievements.map((ua) => ua.achievementId))

  // Check each achievement
  for (const achievement of achievements) {
    if (earnedIds.has(achievement.id)) {
      // Update progress even if already earned
      const progress = calculateProgress(achievement.category, achievement.threshold, userId, deliveredOrders)
      await db.userAchievement.updateMany({
        where: { userId, achievementId: achievement.id },
        data: { progress },
      })
      continue
    }

    const progress = calculateProgress(achievement.category, achievement.threshold, userId, deliveredOrders)

    if (progress >= achievement.threshold) {
      // Award the achievement
      await db.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          progress: achievement.threshold,
          completed: true,
          completedAt: new Date(),
        },
      })

      // Award XP reward
      if (achievement.xpReward > 0) {
        const user = await db.user.findUnique({ where: { id: userId } })
        if (user) {
          const newXP = user.xp + achievement.xpReward
          const newLevel = Math.floor(newXP / 500) + 1
          await db.user.update({
            where: { id: userId },
            data: { xp: newXP, level: newLevel },
          })
        }
      }

      // Check for badges too
      const badges = await db.badge.findMany({
        where: { category: achievement.category },
      })
      const userBadges = await db.userBadge.findMany({
        where: { userId },
      })
      const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId))

      for (const badge of badges) {
        if (!earnedBadgeIds.has(badge.id) && progress >= badge.threshold) {
          await db.userBadge.create({
            data: {
              userId,
              badgeId: badge.id,
            },
          })

          if (badge.xpReward > 0) {
            const user = await db.user.findUnique({ where: { id: userId } })
            if (user) {
              const newXP = user.xp + badge.xpReward
              const newLevel = Math.floor(newXP / 500) + 1
              await db.user.update({
                where: { id: userId },
                data: { xp: newXP, level: newLevel },
              })
            }
          }
        }
      }
    } else {
      // Update progress
      await db.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        create: {
          userId,
          achievementId: achievement.id,
          progress,
          completed: false,
        },
        update: {
          progress,
        },
      })
    }
  }
}

function calculateProgress(
  category: string,
  _threshold: number,
  _userId: string,
  deliveredOrders: number
): number {
  switch (category) {
    case 'sale':
      return deliveredOrders
    case 'social':
      return deliveredOrders // Simplified: using same metric
    case 'streak':
      return deliveredOrders // Simplified: using same metric
    case 'milestone':
      return deliveredOrders
    default:
      return deliveredOrders
  }
}
