import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getClickConfig } from '@/lib/anti-fraud'

// ─── Helper: Date range for last N days ────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── GET /api/admin ─────────────────────────────────────────────────
// Admin dashboard data with many action types

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // ─── PPC configuration ────────────────────────────────────────
    if (action === 'ppc-config') {
      const config = await getClickConfig()
      return NextResponse.json({ config })
    }

    // ─── Click audit data ─────────────────────────────────────────
    if (action === 'click-audit') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const filter = searchParams.get('filter') // 'fraud', 'valid', 'all'
      const recommenderId = searchParams.get('recommenderId')

      const where: Record<string, unknown> = {}
      if (filter === 'fraud') where.isFraud = true
      if (filter === 'valid') where.isVerified = true
      if (recommenderId) where.recommenderId = recommenderId

      const [clicks, total] = await Promise.all([
        db.clickEvent.findMany({
          where,
          include: {
            recommender: {
              select: { id: true, name: true, phone: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.clickEvent.count({ where }),
      ])

      return NextResponse.json({
        clicks: clicks.map((c) => ({
          id: c.id,
          recommender: c.recommender,
          miniSiteId: c.miniSiteId,
          visitorIp: c.visitorIp,
          visitorFingerprint: c.visitorFingerprint,
          userAgent: c.userAgent,
          isVerified: c.isVerified,
          isFraud: c.isFraud,
          fraudScore: c.fraudScore,
          fraudReasons: c.fraudReasons,
          earnings: c.earnings,
          deviceType: c.deviceType,
          browserName: c.browserName,
          country: c.country,
          createdAt: c.createdAt,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      })
    }

    // ─── Suspicious activities ────────────────────────────────────
    if (action === 'suspicious') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const resolved = searchParams.get('resolved') === 'true'

      const [activities, total] = await Promise.all([
        db.suspiciousActivity.findMany({
          where: { isResolved: resolved },
          include: {
            recommender: {
              select: { id: true, name: true, phone: true, role: true, totalFraudClicks: true, clickEarnings: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.suspiciousActivity.count({ where: { isResolved: resolved } }),
      ])

      return NextResponse.json({
        activities: activities.map((a) => ({
          id: a.id,
          recommender: a.recommender,
          activityType: a.activityType,
          severity: a.severity,
          description: a.description,
          metadata: a.metadata,
          isResolved: a.isResolved,
          resolvedBy: a.resolvedBy,
          resolvedAt: a.resolvedAt,
          createdAt: a.createdAt,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      })
    }

    // ─── Overview stats (PPC-focused) ─────────────────────────────
    if (action === 'overview') {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [
        totalClicksToday,
        validClicksToday,
        fraudClicksToday,
        totalEarningsToday,
        totalSuspicious,
        criticalSuspicious,
        topRecommenders,
      ] = await Promise.all([
        db.clickEvent.count({ where: { createdAt: { gte: todayStart } } }),
        db.clickEvent.count({ where: { createdAt: { gte: todayStart }, isVerified: true } }),
        db.clickEvent.count({ where: { createdAt: { gte: todayStart }, isFraud: true } }),
        db.clickEvent.aggregate({ where: { createdAt: { gte: todayStart }, isVerified: true }, _sum: { earnings: true } }),
        db.suspiciousActivity.count({ where: { isResolved: false } }),
        db.suspiciousActivity.count({ where: { isResolved: false, severity: 'critical' } }),
        db.user.findMany({
          where: { role: 'recommender', totalValidClicks: { gt: 0 } },
          select: {
            id: true,
            name: true,
            phone: true,
            clickEarnings: true,
            totalValidClicks: true,
            totalFraudClicks: true,
          },
          orderBy: { clickEarnings: 'desc' },
          take: 10,
        }),
      ])

      return NextResponse.json({
        today: {
          totalClicks: totalClicksToday,
          validClicks: validClicksToday,
          fraudClicks: fraudClicksToday,
          fraudRate: totalClicksToday > 0 ? Math.round(fraudClicksToday / totalClicksToday * 100) : 0,
          totalEarnings: totalEarningsToday._sum.earnings || 0,
        },
        suspicious: {
          total: totalSuspicious,
          critical: criticalSuspicious,
        },
        topRecommenders,
      })
    }

    // ─── Full overview (complete dashboard) ────────────────────────
    if (action === 'full-overview') {
      const [
        totalOwners,
        totalAmbassadors,
        totalRecommenders,
        totalProducts,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        totalCommissions,
        activeMiniSites,
        recentOrders,
        recentUsers,
      ] = await Promise.all([
        db.user.count({ where: { role: 'owner' } }),
        db.user.count({ where: { role: 'ambassador' } }),
        db.user.count({ where: { role: 'recommender' } }),
        db.product.count(),
        db.order.count(),
        db.order.count({ where: { status: 'pending' } }),
        db.order.count({ where: { status: 'confirmed' } }),
        db.order.count({ where: { status: 'delivered' } }),
        db.order.count({ where: { status: 'cancelled' } }),
        db.order.aggregate({ _sum: { finalPrice: true } }),
        db.commissionPayment.aggregate({ _sum: { amount: true } }),
        db.miniSite.count(),
        db.order.findMany({
          include: {
            miniSite: { include: { product: { select: { name: true, images: { select: { storageUrl: true }, take: 1 } } } } },
            recommender: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        db.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, name: true, phone: true, role: true, createdAt: true },
        }),
      ])

      // Revenue chart data (last 7 days)
      const revenueChartData: any[] = []
      for (let i = 6; i >= 0; i--) {
        const dayStart = daysAgo(i)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)
        const dayRevenue = await db.order.aggregate({
          where: { createdAt: { gte: dayStart, lt: dayEnd }, status: { not: 'cancelled' } },
          _sum: { finalPrice: true },
        })
        revenueChartData.push({
          date: dayStart.toISOString().split('T')[0],
          revenue: dayRevenue._sum.finalPrice || 0,
        })
      }

      return NextResponse.json({
        users: {
          total: totalOwners + totalAmbassadors + totalRecommenders,
          owners: totalOwners,
          ambassadors: totalAmbassadors,
          recommenders: totalRecommenders,
        },
        totalProducts,
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          confirmed: confirmedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        totalRevenue: totalRevenue._sum.finalPrice || 0,
        totalCommissions: totalCommissions._sum.amount || 0,
        activeMiniSites,
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          customerName: o.customerName,
          finalPrice: o.finalPrice,
          status: o.status,
          product: o.miniSite?.product?.name ?? null,
          productImage: o.miniSite?.product?.images?.[0]?.storageUrl ?? null,
          recommender: o.recommender,
          createdAt: o.createdAt,
        })),
        recentUsers: recentUsers.map((u) => ({
          id: u.id,
          name: u.name,
          phone: u.phone,
          role: u.role,
          createdAt: u.createdAt,
        })),
        revenueChartData,
        ordersByStatus: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
      })
    }

    // ─── All users (with pagination, search, role filter) ─────────
    if (action === 'all-users') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const search = searchParams.get('search') || ''
      const role = searchParams.get('role') // owner, ambassador, recommender

      const where: Record<string, unknown> = {}
      if (role) where.role = role
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { phone: { contains: search } },
        ]
      }

      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            xp: true,
            level: true,
            coins: true,
            streak: true,
            clickEarnings: true,
            totalValidClicks: true,
            totalFraudClicks: true,
            createdAt: true,
            _count: { select: { ordersAsRecommender: true, recommenderProducts: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.user.count({ where }),
      ])

      // Check banned status for each user via SystemConfig
      const usersWithBanStatus = await Promise.all(
        users.map(async (u) => {
          const banConfig = await db.systemConfig.findUnique({
            where: { key: `banned:${u.id}` },
          })
          return {
            ...u,
            isBanned: banConfig ? (JSON.parse(banConfig.value) as { banned: boolean }).banned : false,
          }
        })
      )

      return NextResponse.json({
        users: usersWithBanStatus,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      })
    }

    // ─── All orders (with pagination, status filter, date range) ───
    if (action === 'all-orders') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const status = searchParams.get('status') // pending, confirmed, delivered, cancelled
      const search = searchParams.get('search') || ''
      const dateFrom = searchParams.get('dateFrom')
      const dateTo = searchParams.get('dateTo')

      const where: Record<string, unknown> = {}
      if (status) where.status = status
      if (search) {
        where.OR = [
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
        ]
      }
      if (dateFrom || dateTo) {
        where.createdAt = {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        }
      }

      const [orders, total] = await Promise.all([
        db.order.findMany({
          where,
          include: {
            miniSite: {
              include: {
                product: {
                  select: { name: true, basePrice: true, images: { select: { storageUrl: true }, take: 1 } },
                },
              },
            },
            recommender: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.order.count({ where }),
      ])

      return NextResponse.json({
        orders: orders.map((o) => ({
          id: o.id,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          customerAddress: o.customerAddress,
          customerMessage: o.customerMessage,
          finalPrice: o.finalPrice,
          commissionRecommender: o.commissionRecommender,
          commissionAmbassador: o.commissionAmbassador,
          status: o.status,
          product: o.miniSite?.product?.name ?? null,
          productImage: o.miniSite?.product?.images?.[0]?.storageUrl ?? null,
          productBasePrice: o.miniSite?.product?.basePrice ?? null,
          recommender: o.recommender,
          miniSiteId: o.miniSiteId,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      })
    }

    // ─── All products (with images, miniSite, search, status filter) ─
    if (action === 'all-products') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const search = searchParams.get('search') || ''
      const status = searchParams.get('status') // active, inactive

      const where: Record<string, unknown> = {}
      if (status) where.status = status
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
          { category: { contains: search } },
        ]
      }

      const [products, total] = await Promise.all([
        db.product.findMany({
          where,
          include: {
            images: { orderBy: { position: 'asc' } },
            miniSite: { select: { id: true, slug: true } },
            owner: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.product.count({ where }),
      ])

      return NextResponse.json({
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          basePrice: p.basePrice,
          category: p.category,
          stock: p.stock,
          status: p.status,
          maxCommission: p.maxCommission,
          weight: p.weight,
          dimensions: p.dimensions,
          sourceUrl: p.sourceUrl,
          images: p.images,
          miniSite: p.miniSite,
          owner: p.owner,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      })
    }

    // ─── All mini-sites (with product, order count, revenue) ───────
    if (action === 'all-mini-sites') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const [miniSites, total] = await Promise.all([
        db.miniSite.findMany({
          include: {
            product: {
              select: { name: true, basePrice: true, status: true, images: { select: { storageUrl: true }, take: 1 } },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.miniSite.count(),
      ])

      // Get order count, revenue, and recommender count for each mini-site
      const miniSiteStats = await Promise.all(
        miniSites.map(async (ms) => {
          const [orderCount, revenue, recommenderProducts] = await Promise.all([
            db.order.count({ where: { miniSiteId: ms.id } }),
            db.order.aggregate({
              where: { miniSiteId: ms.id, status: { not: 'cancelled' } },
              _sum: { finalPrice: true },
            }),
            db.recommenderProduct.count({ where: { miniSiteId: ms.id } }),
          ])
          return { id: ms.id, orderCount, revenue: revenue._sum.finalPrice || 0, recommenderProducts }
        })
      )

      const statsMap = new Map(miniSiteStats.map((s) => [s.id, s]))

      return NextResponse.json({
        miniSites: miniSites.map((ms) => ({
          id: ms.id,
          slug: ms.slug,
          productId: ms.productId,
          product: ms.product,
          _count: {
            orders: statsMap.get(ms.id)?.orderCount ?? 0,
            recommenderProducts: statsMap.get(ms.id)?.recommenderProducts ?? 0,
          },
          revenue: statsMap.get(ms.id)?.revenue ?? 0,
          createdAt: ms.createdAt,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      })
    }

    // ─── Gamification config (badges, achievements, quests, rewards) ─
    if (action === 'gamification-config') {
      const [badges, achievements, dailyQuests, rewards] = await Promise.all([
        db.badge.findMany({ orderBy: { rarity: 'asc' } }),
        db.achievement.findMany({ orderBy: { category: 'asc' } }),
        db.dailyQuest.findMany({ orderBy: { type: 'asc' } }),
        db.reward.findMany({ orderBy: { coinCost: 'asc' } }),
      ])

      return NextResponse.json({
        badges,
        achievements,
        dailyQuests,
        rewards,
      })
    }

    // ─── System stats ─────────────────────────────────────────────
    if (action === 'system-stats') {
      const [
        userCount,
        productCount,
        orderCount,
        miniSiteCount,
        badgeCount,
        achievementCount,
        questCount,
        rewardCount,
        clickEventCount,
        suspiciousActivityCount,
        commissionPaymentCount,
        systemConfigCount,
      ] = await Promise.all([
        db.user.count(),
        db.product.count(),
        db.order.count(),
        db.miniSite.count(),
        db.badge.count(),
        db.achievement.count(),
        db.dailyQuest.count(),
        db.reward.count(),
        db.clickEvent.count(),
        db.suspiciousActivity.count(),
        db.commissionPayment.count(),
        db.systemConfig.count(),
      ])

      // Get database file size (SQLite)
      const fs = await import('fs/promises')
      const path = await import('path')
      let dbSizeBytes = 0
      try {
        const dbPath = path.join(process.cwd(), 'db', 'custom.db')
        const stat = await fs.stat(dbPath)
        dbSizeBytes = stat.size
      } catch {
        // DB file might not exist at expected path
      }

      return NextResponse.json({
        records: {
          users: userCount,
          products: productCount,
          orders: orderCount,
          miniSites: miniSiteCount,
          badges: badgeCount,
          achievements: achievementCount,
          dailyQuests: questCount,
          rewards: rewardCount,
          clickEvents: clickEventCount,
          suspiciousActivities: suspiciousActivityCount,
          commissionPayments: commissionPaymentCount,
          systemConfigs: systemConfigCount,
        },
        totalRecords: userCount + productCount + orderCount + miniSiteCount + badgeCount +
          achievementCount + questCount + rewardCount + clickEventCount +
          suspiciousActivityCount + commissionPaymentCount + systemConfigCount,
        databaseSize: {
          bytes: dbSizeBytes,
          humanReadable: dbSizeBytes >= 1048576
            ? `${(dbSizeBytes / 1048576).toFixed(2)} MB`
            : dbSizeBytes >= 1024
              ? `${(dbSizeBytes / 1024).toFixed(2)} KB`
              : `${dbSizeBytes} B`,
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          uptime: process.uptime(),
          memoryUsage: {
            rss: `${(process.memoryUsage().rss / 1048576).toFixed(2)} MB`,
            heapUsed: `${(process.memoryUsage().heapUsed / 1048576).toFixed(2)} MB`,
            heapTotal: `${(process.memoryUsage().heapTotal / 1048576).toFixed(2)} MB`,
          },
        },
      })
    }

    // ─── System settings (all non-banned keys) ──────────────────────
    if (action === 'system-settings') {
      const configs = await db.systemConfig.findMany({
        where: {
          NOT: {
            key: { startsWith: 'banned:' },
          },
        },
        orderBy: { key: 'asc' },
      })

      return NextResponse.json({
        settings: configs.reduce<Record<string, string>>((acc, c) => {
          acc[c.key] = c.value
          return acc
        }, {}),
      })
    }

    // ─── Wallet overview ──────────────────────────────────────────
    if (action === 'wallet-overview') {
      const [totalPlans, activePlans, completedPlans, totalGoals, activeGoals, completedGoals] = await Promise.all([
        db.installmentPlan.count(),
        db.installmentPlan.count({ where: { status: 'active' } }),
        db.installmentPlan.count({ where: { status: 'completed' } }),
        db.savingsGoal.count(),
        db.savingsGoal.count({ where: { status: 'active' } }),
        db.savingsGoal.count({ where: { status: 'completed' } }),
      ])

      const totalCreditAmount = await db.installmentPlan.aggregate({
        _sum: { totalAmount: true, remainingAmount: true },
        where: { status: 'active' },
      })

      const totalSavingsAmount = await db.savingsGoal.aggregate({
        _sum: { targetAmount: true, currentAmount: true },
        where: { status: 'active' },
      })

      const overduePlans = await db.installmentPlan.count({
        where: {
          status: 'active',
          nextDueDate: { lt: new Date() },
        },
      })

      const recentPlans = await db.installmentPlan.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: { include: { user: { select: { id: true, name: true, phone: true } } } },
        },
      })

      const recentGoals = await db.savingsGoal.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: { include: { user: { select: { id: true, name: true, phone: true } } } },
        },
      })

      // Wallet config from SystemConfig
      const walletConfigs = await db.systemConfig.findMany({
        where: {
          key: {
            in: [
              'wallet_min_down_payment_pct',
              'wallet_max_down_payment_pct',
              'wallet_max_installment_days',
              'wallet_min_installment_days',
              'wallet_daily_reminder_enabled',
              'wallet_daily_reminder_hour',
              'wallet_late_penalty_enabled',
              'wallet_late_penalty_pct',
              'wallet_max_active_plans',
              'wallet_max_active_goals',
              'wallet_min_savings_deposit',
              'wallet_credit_enabled',
              'wallet_savings_enabled',
            ],
          },
        },
      })

      // Build config map with defaults
      const configMap: Record<string, string> = {}
      walletConfigs.forEach(c => { configMap[c.key] = c.value })

      const walletConfig = {
        wallet_min_down_payment_pct: configMap['wallet_min_down_payment_pct'] || '20',
        wallet_max_down_payment_pct: configMap['wallet_max_down_payment_pct'] || '80',
        wallet_max_installment_days: configMap['wallet_max_installment_days'] || '180',
        wallet_min_installment_days: configMap['wallet_min_installment_days'] || '7',
        wallet_daily_reminder_enabled: configMap['wallet_daily_reminder_enabled'] || 'true',
        wallet_daily_reminder_hour: configMap['wallet_daily_reminder_hour'] || '9',
        wallet_late_penalty_enabled: configMap['wallet_late_penalty_enabled'] || 'false',
        wallet_late_penalty_pct: configMap['wallet_late_penalty_pct'] || '0',
        wallet_max_active_plans: configMap['wallet_max_active_plans'] || '5',
        wallet_max_active_goals: configMap['wallet_max_active_goals'] || '10',
        wallet_min_savings_deposit: configMap['wallet_min_savings_deposit'] || '100',
        wallet_credit_enabled: configMap['wallet_credit_enabled'] || 'true',
        wallet_savings_enabled: configMap['wallet_savings_enabled'] || 'true',
      }

      const pushSubscriptionCount = await db.pushSubscription.count()

      return NextResponse.json({
        stats: {
          credit: {
            total: totalPlans,
            active: activePlans,
            completed: completedPlans,
            overdue: overduePlans,
            totalAmount: totalCreditAmount._sum.totalAmount || 0,
            remainingAmount: totalCreditAmount._sum.remainingAmount || 0,
          },
          savings: {
            total: totalGoals,
            active: activeGoals,
            completed: completedGoals,
            targetAmount: totalSavingsAmount._sum.targetAmount || 0,
            currentAmount: totalSavingsAmount._sum.currentAmount || 0,
          },
          pushSubscriptions: pushSubscriptionCount,
        },
        recentPlans: recentPlans.map(p => ({
          id: p.id,
          productName: p.productName,
          totalAmount: p.totalAmount,
          remainingAmount: p.remainingAmount,
          installmentAmount: p.installmentAmount,
          paidInstallments: p.paidInstallments,
          totalInstallments: p.totalInstallments,
          status: p.status,
          nextDueDate: p.nextDueDate,
          frequency: p.frequency,
          createdAt: p.createdAt,
          user: p.wallet.user,
        })),
        recentGoals: recentGoals.map(g => ({
          id: g.id,
          productName: g.productName,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          dailyTarget: g.dailyTarget,
          status: g.status,
          targetDate: g.targetDate,
          createdAt: g.createdAt,
          user: g.wallet.user,
        })),
        config: walletConfig,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/admin ────────────────────────────────────────────────
// Comprehensive admin actions

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // ─── Update PPC configuration ─────────────────────────────────
    if (action === 'update-ppc') {
      const {
        ratePerClick,
        maxClicksPerIpPerDay,
        maxClicksPerFingerprint,
        minClickIntervalMs,
        maxClicksPerRecommender,
        fraudScoreThreshold,
        autoBlockEnabled,
        velocityWindowMinutes,
        maxClicksInVelocityWindow,
        requireVerification,
        active,
      } = body

      const config = await getClickConfig()

      const updated = await db.clickConfig.update({
        where: { id: config.id },
        data: {
          ...(ratePerClick !== undefined && { ratePerClick: parseFloat(ratePerClick) }),
          ...(maxClicksPerIpPerDay !== undefined && { maxClicksPerIpPerDay: parseInt(maxClicksPerIpPerDay) }),
          ...(maxClicksPerFingerprint !== undefined && { maxClicksPerFingerprint: parseInt(maxClicksPerFingerprint) }),
          ...(minClickIntervalMs !== undefined && { minClickIntervalMs: parseInt(minClickIntervalMs) }),
          ...(maxClicksPerRecommender !== undefined && { maxClicksPerRecommender: parseInt(maxClicksPerRecommender) }),
          ...(fraudScoreThreshold !== undefined && { fraudScoreThreshold: parseInt(fraudScoreThreshold) }),
          ...(autoBlockEnabled !== undefined && { autoBlockEnabled: Boolean(autoBlockEnabled) }),
          ...(velocityWindowMinutes !== undefined && { velocityWindowMinutes: parseInt(velocityWindowMinutes) }),
          ...(maxClicksInVelocityWindow !== undefined && { maxClicksInVelocityWindow: parseInt(maxClicksInVelocityWindow) }),
          ...(requireVerification !== undefined && { requireVerification: Boolean(requireVerification) }),
          ...(active !== undefined && { active: Boolean(active) }),
        },
      })

      return NextResponse.json({ config: updated })
    }

    // ─── Resolve suspicious activity ──────────────────────────────
    if (action === 'resolve-suspicious') {
      const { activityId, resolvedBy } = body
      if (!activityId) {
        return NextResponse.json({ error: 'activityId is required' }, { status: 400 })
      }

      const updated = await db.suspiciousActivity.update({
        where: { id: activityId },
        data: {
          isResolved: true,
          resolvedBy: resolvedBy || 'admin',
          resolvedAt: new Date(),
        },
      })

      return NextResponse.json({ activity: updated })
    }

    // ─── Reject fraudulent clicks and reverse earnings ─────────────
    if (action === 'reject-clicks') {
      const { recommenderId, clickIds } = body

      if (!recommenderId) {
        return NextResponse.json({ error: 'recommenderId is required' }, { status: 400 })
      }

      let rejectedCount = 0
      let reversedEarnings = 0

      if (clickIds && Array.isArray(clickIds)) {
        for (const clickId of clickIds) {
          const click = await db.clickEvent.findUnique({ where: { id: clickId } })
          if (click && click.isVerified && click.earnings > 0) {
            reversedEarnings += click.earnings
            await db.clickEvent.update({
              where: { id: clickId },
              data: { isVerified: false, isFraud: true, earnings: 0, fraudReasons: 'ADMIN_REJECTED' },
            })
            rejectedCount++
          }
        }
      } else {
        const suspiciousVerified = await db.clickEvent.findMany({
          where: {
            recommenderId,
            isVerified: true,
            fraudScore: { gte: 50 },
          },
        })

        for (const click of suspiciousVerified) {
          reversedEarnings += click.earnings
          await db.clickEvent.update({
            where: { id: click.id },
            data: { isVerified: false, isFraud: true, earnings: 0, fraudReasons: 'ADMIN_REJECTED' },
          })
          rejectedCount++
        }
      }

      if (reversedEarnings > 0) {
        await db.user.update({
          where: { id: recommenderId },
          data: {
            clickEarnings: { decrement: reversedEarnings },
            totalValidClicks: { decrement: rejectedCount },
            totalFraudClicks: { increment: rejectedCount },
          },
        })
      }

      return NextResponse.json({ rejectedCount, reversedEarnings })
    }

    // ─── Update user role ─────────────────────────────────────────
    if (action === 'update-user-role') {
      const { userId, role, ambassadorId } = body
      if (!userId || !role) {
        return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
      }
      const validRoles = ['owner', 'ambassador', 'recommender']
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 })
      }

      const data: Record<string, unknown> = { role }
      if (ambassadorId !== undefined) data.ambassadorId = ambassadorId || null

      const updated = await db.user.update({
        where: { id: userId },
        data,
        select: { id: true, name: true, phone: true, role: true, ambassadorId: true },
      })

      return NextResponse.json({ user: updated })
    }

    // ─── Toggle product status ────────────────────────────────────
    if (action === 'toggle-product-status') {
      const { productId, status } = body
      if (!productId) {
        return NextResponse.json({ error: 'productId is required' }, { status: 400 })
      }
      const newStatus = status || undefined
      if (newStatus && !['active', 'inactive'].includes(newStatus)) {
        return NextResponse.json({ error: 'Invalid status. Must be active or inactive' }, { status: 400 })
      }

      const product = await db.product.findUnique({ where: { id: productId } })
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      const updated = await db.product.update({
        where: { id: productId },
        data: { status: newStatus || (product.status === 'active' ? 'inactive' : 'active') },
      })

      return NextResponse.json({ product: updated })
    }

    // ─── Update order status ──────────────────────────────────────
    if (action === 'update-order-status') {
      const { orderId, status } = body
      if (!orderId || !status) {
        return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 })
      }
      const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
      }

      const updated = await db.order.update({
        where: { id: orderId },
        data: { status },
      })

      return NextResponse.json({ order: updated })
    }

    // ─── Delete product and related data ──────────────────────────
    if (action === 'delete-product') {
      const { productId } = body
      if (!productId) {
        return NextResponse.json({ error: 'productId is required' }, { status: 400 })
      }

      const product = await db.product.findUnique({ where: { id: productId } })
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      // Delete in order: orders → commission payments → recommender products → mini-site → images → product
      // Cascade deletes handle most relations but we delete explicitly for safety
      const miniSite = await db.miniSite.findUnique({ where: { productId } })

      if (miniSite) {
        // Get order IDs for commission payments deletion
        const orders = await db.order.findMany({
          where: { miniSiteId: miniSite.id },
          select: { id: true },
        })
        const orderIds = orders.map((o) => o.id)

        // Delete commission payments for these orders
        if (orderIds.length > 0) {
          await db.commissionPayment.deleteMany({
            where: { orderId: { in: orderIds } },
          })
        }

        // Delete orders
        await db.order.deleteMany({ where: { miniSiteId: miniSite.id } })

        // Delete recommender products
        await db.recommenderProduct.deleteMany({ where: { miniSiteId: miniSite.id } })
      }

      // Delete mini-site (if exists)
      if (miniSite) {
        await db.miniSite.delete({ where: { id: miniSite.id } })
      }

      // Delete product images
      await db.productImage.deleteMany({ where: { productId } })

      // Delete the product
      await db.product.delete({ where: { id: productId } })

      return NextResponse.json({ success: true, deleted: productId })
    }

    // ─── Create badge ─────────────────────────────────────────────
    if (action === 'create-badge') {
      const { name, description, icon, category, rarity, threshold, xpReward, coinReward } = body
      if (!name || !description || !icon || !category) {
        return NextResponse.json({ error: 'name, description, icon, and category are required' }, { status: 400 })
      }

      const badge = await db.badge.create({
        data: {
          name,
          description,
          icon,
          category,
          rarity: rarity || 'common',
          threshold: threshold || 0,
          xpReward: xpReward || 0,
          coinReward: coinReward || 0,
        },
      })

      return NextResponse.json({ badge })
    }

    // ─── Update badge ─────────────────────────────────────────────
    if (action === 'update-badge') {
      const { badgeId, ...data } = body
      if (!badgeId) {
        return NextResponse.json({ error: 'badgeId is required' }, { status: 400 })
      }

      const updateData: Record<string, unknown> = {}
      const allowedFields = ['name', 'description', 'icon', 'category', 'rarity', 'threshold', 'xpReward', 'coinReward']
      for (const field of allowedFields) {
        if (data[field] !== undefined) updateData[field] = data[field]
      }

      const badge = await db.badge.update({
        where: { id: badgeId },
        data: updateData,
      })

      return NextResponse.json({ badge })
    }

    // ─── Delete badge ─────────────────────────────────────────────
    if (action === 'delete-badge') {
      const { badgeId } = body
      if (!badgeId) {
        return NextResponse.json({ error: 'badgeId is required' }, { status: 400 })
      }

      // Delete user badges first
      await db.userBadge.deleteMany({ where: { badgeId } })
      await db.badge.delete({ where: { id: badgeId } })

      return NextResponse.json({ success: true })
    }

    // ─── Create achievement ───────────────────────────────────────
    if (action === 'create-achievement') {
      const { name, description, icon, category, threshold, xpReward, coinReward } = body
      if (!name || !description || !icon || !category) {
        return NextResponse.json({ error: 'name, description, icon, and category are required' }, { status: 400 })
      }

      const achievement = await db.achievement.create({
        data: {
          name,
          description,
          icon,
          category,
          threshold: threshold || 0,
          xpReward: xpReward || 0,
          coinReward: coinReward || 0,
        },
      })

      return NextResponse.json({ achievement })
    }

    // ─── Update achievement ───────────────────────────────────────
    if (action === 'update-achievement') {
      const { achievementId, ...data } = body
      if (!achievementId) {
        return NextResponse.json({ error: 'achievementId is required' }, { status: 400 })
      }

      const updateData: Record<string, unknown> = {}
      const allowedFields = ['name', 'description', 'icon', 'category', 'threshold', 'xpReward', 'coinReward']
      for (const field of allowedFields) {
        if (data[field] !== undefined) updateData[field] = data[field]
      }

      const achievement = await db.achievement.update({
        where: { id: achievementId },
        data: updateData,
      })

      return NextResponse.json({ achievement })
    }

    // ─── Delete achievement ───────────────────────────────────────
    if (action === 'delete-achievement') {
      const { achievementId } = body
      if (!achievementId) {
        return NextResponse.json({ error: 'achievementId is required' }, { status: 400 })
      }

      await db.userAchievement.deleteMany({ where: { achievementId } })
      await db.achievement.delete({ where: { id: achievementId } })

      return NextResponse.json({ success: true })
    }

    // ─── Create quest ─────────────────────────────────────────────
    if (action === 'create-quest') {
      const { name, description, icon, category, type, threshold, xpReward, coinReward, dayOfWeek } = body
      if (!name || !description || !icon || !category) {
        return NextResponse.json({ error: 'name, description, icon, and category are required' }, { status: 400 })
      }

      const quest = await db.dailyQuest.create({
        data: {
          name,
          description,
          icon,
          category,
          type: type || 'daily',
          threshold: threshold || 1,
          xpReward: xpReward || 0,
          coinReward: coinReward || 0,
          dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : null,
        },
      })

      return NextResponse.json({ quest })
    }

    // ─── Update quest ─────────────────────────────────────────────
    if (action === 'update-quest') {
      const { questId, ...data } = body
      if (!questId) {
        return NextResponse.json({ error: 'questId is required' }, { status: 400 })
      }

      const updateData: Record<string, unknown> = {}
      const allowedFields = ['name', 'description', 'icon', 'category', 'type', 'threshold', 'xpReward', 'coinReward', 'dayOfWeek']
      for (const field of allowedFields) {
        if (data[field] !== undefined) updateData[field] = data[field]
      }

      const quest = await db.dailyQuest.update({
        where: { id: questId },
        data: updateData,
      })

      return NextResponse.json({ quest })
    }

    // ─── Toggle quest active status ───────────────────────────────
    if (action === 'toggle-quest') {
      const { questId } = body
      if (!questId) {
        return NextResponse.json({ error: 'questId is required' }, { status: 400 })
      }

      const quest = await db.dailyQuest.findUnique({ where: { id: questId } })
      if (!quest) {
        return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
      }

      const updated = await db.dailyQuest.update({
        where: { id: questId },
        data: { active: !quest.active },
      })

      return NextResponse.json({ quest: updated })
    }

    // ─── Create reward ────────────────────────────────────────────
    if (action === 'create-reward') {
      const { name, description, icon, category, coinCost, xpBonus, rarity } = body
      if (!name || !description || !icon || !category) {
        return NextResponse.json({ error: 'name, description, icon, and category are required' }, { status: 400 })
      }

      const reward = await db.reward.create({
        data: {
          name,
          description,
          icon,
          category,
          coinCost: coinCost || 0,
          xpBonus: xpBonus || 0,
          rarity: rarity || 'common',
        },
      })

      return NextResponse.json({ reward })
    }

    // ─── Update reward ────────────────────────────────────────────
    if (action === 'update-reward') {
      const { rewardId, ...data } = body
      if (!rewardId) {
        return NextResponse.json({ error: 'rewardId is required' }, { status: 400 })
      }

      const updateData: Record<string, unknown> = {}
      const allowedFields = ['name', 'description', 'icon', 'category', 'coinCost', 'xpBonus', 'rarity']
      for (const field of allowedFields) {
        if (data[field] !== undefined) updateData[field] = data[field]
      }

      const reward = await db.reward.update({
        where: { id: rewardId },
        data: updateData,
      })

      return NextResponse.json({ reward })
    }

    // ─── Toggle reward active status ──────────────────────────────
    if (action === 'toggle-reward') {
      const { rewardId } = body
      if (!rewardId) {
        return NextResponse.json({ error: 'rewardId is required' }, { status: 400 })
      }

      const reward = await db.reward.findUnique({ where: { id: rewardId } })
      if (!reward) {
        return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
      }

      const updated = await db.reward.update({
        where: { id: rewardId },
        data: { active: !reward.active },
      })

      return NextResponse.json({ reward: updated })
    }

    // ─── Update system settings ───────────────────────────────────
    if (action === 'update-system') {
      const { settings } = body
      if (!settings || typeof settings !== 'object') {
        return NextResponse.json({ error: 'settings object is required' }, { status: 400 })
      }

      // Upsert each key-value pair into SystemConfig
      const results: any[] = []
      for (const [key, value] of Object.entries(settings)) {
        const config = await db.systemConfig.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
        results.push(config)
      }

      return NextResponse.json({ configs: results })
    }

    // ─── Award XP to a user ──────────────────────────────────────
    if (action === 'award-xp') {
      const { userId, amount } = body
      if (!userId || !amount) {
        return NextResponse.json({ error: 'userId and amount are required' }, { status: 400 })
      }
      const xpAmount = parseInt(amount)
      if (isNaN(xpAmount) || xpAmount <= 0) {
        return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
      }

      const user = await db.user.update({
        where: { id: userId },
        data: { xp: { increment: xpAmount } },
        select: { id: true, name: true, xp: true, level: true },
      })

      return NextResponse.json({ user, awarded: xpAmount })
    }

    // ─── Award coins to a user ───────────────────────────────────
    if (action === 'award-coins') {
      const { userId, amount } = body
      if (!userId || !amount) {
        return NextResponse.json({ error: 'userId and amount are required' }, { status: 400 })
      }
      const coinAmount = parseInt(amount)
      if (isNaN(coinAmount) || coinAmount <= 0) {
        return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
      }

      const user = await db.user.update({
        where: { id: userId },
        data: { coins: { increment: coinAmount } },
        select: { id: true, name: true, coins: true },
      })

      return NextResponse.json({ user, awarded: coinAmount })
    }

    // ─── Ban/unban user ──────────────────────────────────────────
    if (action === 'ban-user') {
      const { userId, banned, reason } = body
      if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 })
      }

      const isBanned = banned !== undefined ? Boolean(banned) : true

      // Store ban status as SystemConfig key-value (since User model doesn't have a banned field)
      // We use a convention: key = "banned:{userId}", value = JSON with banned status and reason
      const banValue = JSON.stringify({ banned: isBanned, reason: reason || '', bannedAt: isBanned ? new Date().toISOString() : null })

      await db.systemConfig.upsert({
        where: { key: `banned:${userId}` },
        update: { value: banValue },
        create: { key: `banned:${userId}`, value: banValue },
      })

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, phone: true, role: true },
      })

      return NextResponse.json({ user, banned: isBanned, reason: reason || '' })
    }

    // ─── Update system setting ───────────────────────────────────
    if (action === 'update-system-setting') {
      const { key, value } = body
      if (!key || value === undefined) {
        return NextResponse.json({ error: 'key and value are required' }, { status: 400 })
      }

      const updated = await db.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })

      return NextResponse.json({ setting: updated })
    }

    // ─── Edit product ──────────────────────────────────────────────
    if (action === 'edit-product') {
      const { id, name, description, basePrice, category, stock, maxCommission, weight, dimensions, images } = body
      if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 })
      }

      const product = await db.product.update({
        where: { id },
        data: {
          name,
          description,
          basePrice,
          category,
          stock,
          maxCommission,
          weight,
          dimensions,
          images: {
            deleteMany: {},
            create: images?.map((img: any) => ({
              storageUrl: img.url,
              position: img.position,
            })) || [],
          },
        },
        include: {
          images: { orderBy: { position: 'asc' } },
          miniSite: { select: { id: true, slug: true } },
          owner: { select: { id: true, name: true, phone: true } },
        },
      })

      return NextResponse.json({ product })
    }

    // ─── Update wallet config ────────────────────────────────────
    if (action === 'update-wallet-config') {
      const { settings } = body
      if (!settings || typeof settings !== 'object') {
        return NextResponse.json({ error: 'settings est requis' }, { status: 400 })
      }

      const validKeys = [
        'wallet_min_down_payment_pct',
        'wallet_max_down_payment_pct',
        'wallet_max_installment_days',
        'wallet_min_installment_days',
        'wallet_daily_reminder_enabled',
        'wallet_daily_reminder_hour',
        'wallet_late_penalty_enabled',
        'wallet_late_penalty_pct',
        'wallet_max_active_plans',
        'wallet_max_active_goals',
        'wallet_min_savings_deposit',
        'wallet_credit_enabled',
        'wallet_savings_enabled',
      ]

      let updateCount = 0
      for (const [key, value] of Object.entries(settings)) {
        if (validKeys.includes(key)) {
          await db.systemConfig.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
          })
          updateCount++
        }
      }

      // Sync with cron-job.org if enabled
      try {
        if (settings.wallet_daily_reminder_enabled === 'true') {
          const { ensureWalletCronJob, deleteCronJob, listCronJobs } = await import('@/lib/cronjob-org')
          const cronSecret = process.env.CRON_SECRET || 'default_secret'
          const baseUrl = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3000'
          const protocol = baseUrl.startsWith('http') ? '' : 'https://'
          
          // Parse hours from settings (e.g. "8,12,18")
          const hoursStr = settings.wallet_daily_reminder_hour || '9'
          const hours = hoursStr.split(',').map((h: string) => parseInt(h.trim())).filter((h: number) => !isNaN(h))
          
          if (hours.length > 0) {
            await ensureWalletCronJob(`${protocol}${baseUrl}`, cronSecret, hours)
          }
        } else {
          // Disable/Delete if disabled
          const { listCronJobs, deleteCronJob } = await import('@/lib/cronjob-org')
          const jobs = await listCronJobs()
          const existingJob = jobs.find(j => j.title === 'Kidenzo Wallet - Rappels Remboursement')
          if (existingJob && existingJob.jobId) {
            await deleteCronJob(existingJob.jobId)
          }
        }
      } catch (e) {
        console.error("Erreur synchronisation cron-job.org:", e)
        // Non-bloquant pour l'admin
      }

      return NextResponse.json({ success: true, updated: updateCount })
    }

    // ─── Trigger wallet cron manually ────────────────────────────
    if (action === 'trigger-wallet-cron') {
      try {
        const cronSecret = process.env.CRON_SECRET || ''
        const baseUrl = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3000'
        const protocol = baseUrl.startsWith('http') ? '' : 'http://'
        const cronUrl = `${protocol}${baseUrl}/api/wallet/cron?secret=${encodeURIComponent(cronSecret)}`

        const cronRes = await fetch(cronUrl)
        const cronData = await cronRes.json()

        return NextResponse.json({ success: true, cronResult: cronData })
      } catch (error) {
        console.error('Trigger cron error:', error)
        return NextResponse.json({ error: 'Erreur lors du déclenchement du cron' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    console.error('Admin POST error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error?.message || String(error) }, { status: 500 })
  }
}
