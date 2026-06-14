import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const suffix = Math.random().toString(36).substring(2, 8)
  return `${base}-${suffix}`
}

// GET /api/mini-sites - Get mini-site by slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'slug query parameter is required' },
        { status: 400 }
      )
    }

    const miniSite = await db.miniSite.findUnique({
      where: { slug },
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
    })

    if (!miniSite) {
      return NextResponse.json(
        { error: 'Mini-site not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ miniSite })
  } catch (error) {
    console.error('MiniSites GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/mini-sites - Generate mini-site for a product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    // Check product exists
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { miniSite: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if mini-site already exists for this product
    if (product.miniSite) {
      return NextResponse.json(
        { error: 'Mini-site already exists for this product', miniSite: product.miniSite },
        { status: 409 }
      )
    }

    // Generate unique slug
    let slug = generateSlug(product.name)
    let attempts = 0
    while (await db.miniSite.findUnique({ where: { slug } })) {
      slug = generateSlug(product.name)
      attempts++
      if (attempts > 10) {
        return NextResponse.json(
          { error: 'Could not generate unique slug' },
          { status: 500 }
        )
      }
    }

    const miniSite = await db.miniSite.create({
      data: {
        productId,
        slug,
      },
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
    })

    return NextResponse.json({ miniSite }, { status: 201 })
  } catch (error) {
    console.error('MiniSites POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
