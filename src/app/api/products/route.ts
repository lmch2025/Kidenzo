import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products - List products (optionally filter by ownerId, status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')
    const status = searchParams.get('status')

    const products = await db.product.findMany({
      where: {
        ...(ownerId ? { ownerId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        owner: {
          select: { id: true, name: true, phone: true, role: true },
        },
        images: {
          orderBy: { position: 'asc' },
        },
        miniSite: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ownerId, name, description, basePrice, category, stock, maxCommission, weight, dimensions, sourceUrl, images } = body

    if (!ownerId || !name || !description || basePrice === undefined) {
      return NextResponse.json(
        { error: 'ownerId, name, description, and basePrice are required' },
        { status: 400 }
      )
    }

    // Verify owner exists and has the right role
    const owner = await db.user.findUnique({
      where: { id: ownerId },
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      )
    }

    if (owner.role !== 'owner' && owner.role !== 'ambassador') {
      return NextResponse.json(
        { error: 'Only owners or ambassadors can create products' },
        { status: 403 }
      )
    }

    const product = await db.product.create({
      data: {
        ownerId,
        name,
        description,
        basePrice: parseFloat(String(basePrice)),
        category: category || 'general',
        stock: stock ? parseInt(String(stock)) : 0,
        maxCommission: maxCommission ? parseInt(String(maxCommission)) : 40,
        weight: weight || '',
        dimensions: dimensions || '',
        sourceUrl: sourceUrl || null,
      },
      include: {
        owner: {
          select: { id: true, name: true, phone: true, role: true },
        },
        images: {
          orderBy: { position: 'asc' },
        },
      },
    })

    // Create product images if provided (from import)
    if (images && Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await db.productImage.create({
          data: {
            productId: product.id,
            storageUrl: images[i],
            position: i,
          },
        })
      }
    }

    // Re-fetch with images
    const productWithImages = await db.product.findUnique({
      where: { id: product.id },
      include: {
        owner: {
          select: { id: true, name: true, phone: true, role: true },
        },
        images: {
          orderBy: { position: 'asc' },
        },
      },
    })

    return NextResponse.json({ product: productWithImages || product }, { status: 201 })
  } catch (error) {
    console.error('Products POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/products - Update product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, basePrice, category, stock, status, maxCommission, weight, dimensions, sourceUrl, images } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const existing = await db.product.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (basePrice !== undefined) updateData.basePrice = parseFloat(String(basePrice))
    if (category !== undefined) updateData.category = category
    if (stock !== undefined) updateData.stock = parseInt(String(stock))
    if (status !== undefined) updateData.status = status
    if (maxCommission !== undefined) updateData.maxCommission = parseInt(String(maxCommission))
    if (weight !== undefined) updateData.weight = weight
    if (dimensions !== undefined) updateData.dimensions = dimensions
    if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl

    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, phone: true, role: true },
        },
        images: {
          orderBy: { position: 'asc' },
        },
        miniSite: true,
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Products PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
