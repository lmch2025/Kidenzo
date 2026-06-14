import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAndTrackClick, getClickConfig, generateClickToken } from '@/lib/anti-fraud'

// ─── GET /api/clicks ────────────────────────────────────────────────
// Get click statistics for a recommender or admin audit data

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    // Get public click config
    if (action === 'config') {
      const config = await getClickConfig()
      return NextResponse.json({
        config: {
          ratePerClick: config.ratePerClick,
          active: config.active,
        },
      })
    }

    // Generate click verification token
    if (action === 'token') {
      const recommenderId = searchParams.get('recommenderId')
      const miniSiteId = searchParams.get('miniSiteId')
      if (!recommenderId || !miniSiteId) {
        return NextResponse.json(
          { error: 'recommenderId and miniSiteId are required' },
          { status: 400 }
        )
      }
      const token = generateClickToken(recommenderId, miniSiteId)
      return NextResponse.json({ token })
    }

    // Get click stats for a user
    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        clickEarnings: true,
        totalValidClicks: true,
        totalFraudClicks: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get today's stats
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayValidClicks = await db.clickEvent.count({
      where: {
        recommenderId: userId,
        isVerified: true,
        createdAt: { gte: todayStart },
      },
    })

    const todayFraudClicks = await db.clickEvent.count({
      where: {
        recommenderId: userId,
        isFraud: true,
        createdAt: { gte: todayStart },
      },
    })

    const todayEarnings = await db.clickEvent.aggregate({
      where: {
        recommenderId: userId,
        isVerified: true,
        createdAt: { gte: todayStart },
      },
      _sum: { earnings: true },
    })

    // Get last 7 days earnings for chart
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const recentClicks = await db.clickEvent.findMany({
      where: {
        recommenderId: userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        id: true,
        miniSiteId: true,
        earnings: true,
        isVerified: true,
        isFraud: true,
        fraudScore: true,
        deviceType: true,
        browserName: true,
        country: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Daily earnings chart data
    const dailyEarnings: Record<string, { valid: number; fraud: number; earnings: number }> = {}
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      dailyEarnings[key] = { valid: 0, fraud: 0, earnings: 0 }
    }

    const allRecentClicks = await db.clickEvent.findMany({
      where: {
        recommenderId: userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        earnings: true,
        isVerified: true,
        isFraud: true,
        createdAt: true,
      },
    })

    for (const click of allRecentClicks) {
      const key = click.createdAt.toISOString().split('T')[0]
      if (dailyEarnings[key]) {
        if (click.isVerified) {
          dailyEarnings[key].valid++
          dailyEarnings[key].earnings += click.earnings
        }
        if (click.isFraud) {
          dailyEarnings[key].fraud++
        }
      }
    }

    // Device breakdown
    const deviceBreakdown = await db.clickEvent.groupBy({
      by: ['deviceType'],
      where: {
        recommenderId: userId,
        createdAt: { gte: sevenDaysAgo },
        isVerified: true,
      },
      _count: { id: true },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        clickEarnings: user.clickEarnings,
        totalValidClicks: user.totalValidClicks,
        totalFraudClicks: user.totalFraudClicks,
      },
      today: {
        validClicks: todayValidClicks,
        fraudClicks: todayFraudClicks,
        earnings: todayEarnings._sum.earnings || 0,
      },
      dailyEarnings,
      recentClicks,
      deviceBreakdown: deviceBreakdown.map((d) => ({
        device: d.deviceType,
        count: d._count.id,
      })),
    })
  } catch (error) {
    console.error('Clicks GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/clicks ───────────────────────────────────────────────
// Track a new click with anti-fraud verification

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      recommenderId,
      miniSiteId,
      userAgent,
      referer,
      sessionId,
      screenResolution,
      timezone,
      language,
      clickToken,
      canvasHash,
      webglHash,
      audioHash,
      fontList,
      platform,
      touchSupport,
      colorDepth,
      deviceMemory,
      hardwareConcurrency,
    } = body

    // Validate required fields
    if (!recommenderId || !miniSiteId) {
      return NextResponse.json(
        { error: 'recommenderId and miniSiteId are required' },
        { status: 400 }
      )
    }

    // Verify recommender exists
    const recommender = await db.user.findUnique({
      where: { id: recommenderId },
    })
    if (!recommender) {
      return NextResponse.json(
        { error: 'Recommender not found' },
        { status: 404 }
      )
    }

    // Verify mini-site exists
    const miniSite = await db.miniSite.findUnique({
      where: { id: miniSiteId },
    })
    if (!miniSite) {
      return NextResponse.json(
        { error: 'Mini-site not found' },
        { status: 404 }
      )
    }

    // Get visitor IP (from headers, proxied through Caddy)
    const visitorIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'

    // Get User-Agent from request headers if not provided in body
    const ua = userAgent || request.headers.get('user-agent') || 'unknown'

    // Run anti-fraud verification
    const result = await verifyAndTrackClick({
      recommenderId,
      miniSiteId,
      visitorIp,
      userAgent: ua,
      referer: referer || request.headers.get('referer') || undefined,
      sessionId,
      screenResolution,
      timezone,
      language,
      clickToken,
      canvasHash,
      webglHash,
      audioHash,
      fontList,
      platform,
      touchSupport,
      colorDepth,
      deviceMemory,
      hardwareConcurrency,
    })

    // Return result (never expose internal fraud details to the client)
    if (result.isFraud) {
      return NextResponse.json({
        success: false,
        verified: false,
        reason: 'Click could not be verified',
        // Don't expose fraud score or reasons to client
      })
    }

    return NextResponse.json({
      success: true,
      verified: true,
      earnings: result.earnings,
    })
  } catch (error) {
    console.error('Clicks POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
