import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/recommender - Get recommender's shared products
// If miniSiteId is provided, returns the specific commission for that mini-site
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const miniSiteId = searchParams.get('miniSiteId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // If miniSiteId is provided, return the specific commission for that mini-site
    if (miniSiteId) {
      const recommenderProduct = await db.recommenderProduct.findUnique({
        where: {
          recommenderId_miniSiteId: {
            recommenderId: userId,
            miniSiteId,
          },
        },
      })

      if (!recommenderProduct) {
        return NextResponse.json({
          commissionPct: 0,
          found: false,
        })
      }

      return NextResponse.json({
        commissionPct: recommenderProduct.commissionPct,
        visits: recommenderProduct.visits,
        found: true,
      })
    }

    // Otherwise, return all recommender products
    const recommenderProducts = await db.recommenderProduct.findMany({
      where: { recommenderId: userId },
      include: {
        miniSite: {
          include: {
            product: {
              include: {
                owner: {
                  select: { id: true, name: true, phone: true, role: true },
                },
                images: {
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ recommenderProducts })
  } catch (error) {
    console.error('Recommender GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/recommender - Set commission or copy link
// Action determined by the presence of fields in the body
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, miniSiteId, commissionPct, action } = body

    if (!userId || !miniSiteId) {
      return NextResponse.json(
        { error: 'userId and miniSiteId are required' },
        { status: 400 }
      )
    }

    // Verify user and mini-site exist
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const miniSite = await db.miniSite.findUnique({
      where: { id: miniSiteId },
      include: { product: true },
    })
    if (!miniSite) {
      return NextResponse.json(
        { error: 'Mini-site not found' },
        { status: 404 }
      )
    }

    if (action === 'copyLink') {
      // Copy link: increment visits counter and return shareable link
      const recommenderProduct = await db.recommenderProduct.findUnique({
        where: {
          recommenderId_miniSiteId: {
            recommenderId: userId,
            miniSiteId,
          },
        },
      })

      if (!recommenderProduct) {
        return NextResponse.json(
          { error: 'Recommender has not shared this product yet. Set commission first.' },
          { status: 400 }
        )
      }

      const updated = await db.recommenderProduct.update({
        where: { id: recommenderProduct.id },
        data: { visits: { increment: 1 } },
      })

      const shareableLink = `/s/${miniSite.slug}?ref=${userId}`

      return NextResponse.json({
        link: shareableLink,
        visits: updated.visits,
      })
    }

    // Default action: Set commission
    if (commissionPct === undefined) {
      return NextResponse.json(
        { error: 'commissionPct is required for setting commission' },
        { status: 400 }
      )
    }

    const commissionValue = parseInt(String(commissionPct))
    if (isNaN(commissionValue) || commissionValue < 0) {
      return NextResponse.json(
        { error: 'commissionPct must be a non-negative integer' },
        { status: 400 }
      )
    }

    // Validate commission doesn't exceed maxCommission on the product
    if (commissionValue > miniSite.product.maxCommission) {
      return NextResponse.json(
        { error: `Commission cannot exceed max commission of ${miniSite.product.maxCommission}%` },
        { status: 400 }
      )
    }

    // Create or update RecommenderProduct entry
    const recommenderProduct = await db.recommenderProduct.upsert({
      where: {
        recommenderId_miniSiteId: {
          recommenderId: userId,
          miniSiteId,
        },
      },
      create: {
        recommenderId: userId,
        miniSiteId,
        commissionPct: commissionValue,
      },
      update: {
        commissionPct: commissionValue,
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
      },
    })

    // Award XP (10) for setting commission
    const currentUser = await db.user.findUnique({ where: { id: userId } })
    if (currentUser) {
      const newXP = currentUser.xp + 10
      const newLevel = Math.floor(newXP / 500) + 1
      await db.user.update({
        where: { id: userId },
        data: {
          xp: newXP,
          level: newLevel,
        },
      })
    }

    return NextResponse.json({ recommenderProduct })
  } catch (error) {
    console.error('Recommender POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
