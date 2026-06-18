import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'

export const dynamic = 'force-dynamic'
import ytSearch from 'yt-search'
import sharp from 'sharp'
import 'cheerio' // Force Vercel @vercel/nft to include cheerio in the serverless function

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '3ca1301a4e529153d12db10659925594'

async function processAndUploadImage(url: string): Promise<string> {
  // If it's already an ImgBB URL or base64, return it
  if (url.includes('ibb.co') || url.startsWith('data:')) return url

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch image')
    
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Convert to webp with sharp
    const webpBuffer = await sharp(buffer)
      .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
      
    // Upload to imgbb
    const imgbbFormData = new FormData()
    imgbbFormData.append('key', IMGBB_API_KEY)
    imgbbFormData.append('image', webpBuffer.toString('base64'))
    
    const imgbbRes = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: imgbbFormData,
    })
    
    if (!imgbbRes.ok) throw new Error('ImgBB upload failed')
    
    const data = await imgbbRes.json()
    return data.data.url
  } catch (err) {
    console.error('Failed to process image:', url, err)
    return url // fallback to original url if processing fails
  }
}

// Cache config to avoid DB lookup on every product list request
let proportionCache: { value: number; expiresAt: number } | null = null

async function getRecommenderProportion(): Promise<number> {
  const now = Date.now()
  if (proportionCache && proportionCache.expiresAt > now) {
    return proportionCache.value
  }

  const config = await withRetry(() => db.systemConfig.findUnique({
    where: { key: 'recommender_commission_proportion' }
  }))
  
  const proportion = config && !isNaN(parseInt(config.value)) ? parseInt(config.value) : 70
  proportionCache = { value: proportion, expiresAt: now + 5 * 60 * 1000 } // cache for 5 minutes
  return proportion
}

// GET /api/products - List products (optionally filter by ownerId, status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')
    const status = searchParams.get('status')
    const limitParam = searchParams.get('limit')
    const skipParam = searchParams.get('skip')

    const parsedLimit = limitParam ? parseInt(limitParam) : undefined
    const parsedSkip = skipParam ? parseInt(skipParam) : undefined

    const limit = parsedLimit !== undefined && !isNaN(parsedLimit) ? parsedLimit : undefined
    const skip = parsedSkip !== undefined && !isNaN(parsedSkip) ? parsedSkip : undefined

    const products = await withRetry(() => db.product.findMany({
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
      ...(limit !== undefined ? { take: limit } : {}),
      ...(skip !== undefined ? { skip: skip } : {}),
    }))

    const proportion = await getRecommenderProportion()

    // Inject recommenderMaxCommission
    const mappedProducts = products.map(p => ({
      ...p,
      recommenderMaxCommission: Math.floor(p.maxCommission * (proportion / 100))
    }))

    return NextResponse.json({ products: mappedProducts })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// POST /api/products - Create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ownerId, name, description, basePrice, category, stock, maxCommission, commissionPerClick, weight, dimensions, sourceUrl, images } = body

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

    let youtubeUrl: string | null = null;
    try {
      // Pour les titres très longs (ex: "Bague Vintage Or 18K d’Âme..."), yt-search échoue souvent
      // On prend les 4 premiers mots du titre pour optimiser la recherche
      const shortQuery = name.split(' ').slice(0, 4).join(' ');
      
      let searchResult = await ytSearch(`${shortQuery} ${category !== 'general' ? category : ''} short`);
      
      // Fallback si la recherche ciblée ne trouve rien
      if (!searchResult || !searchResult.videos || searchResult.videos.length === 0) {
        searchResult = await ytSearch(`${shortQuery} short`);
      }
      
      // Fallback très générique si toujours rien
      if (!searchResult || !searchResult.videos || searchResult.videos.length === 0) {
        searchResult = await ytSearch(`${category !== 'general' ? category : name.split(' ')[0]} short`);
      }

      if (searchResult && searchResult.videos && searchResult.videos.length > 0) {
        youtubeUrl = searchResult.videos[0].url;
      }
    } catch (e) {
      console.error('yt-search error:', e);
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
        commissionPerClick: commissionPerClick ? parseFloat(String(commissionPerClick)) : 0,
        weight: weight || '',
        dimensions: dimensions || '',
        sourceUrl: sourceUrl || null,
        youtubeUrl,
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

    // Process and upload product images if provided (from import)
    if (images && Array.isArray(images) && images.length > 0) {
      const processedImages: string[] = []
      for (const imgUrl of images) {
        const finalUrl = await processAndUploadImage(imgUrl)
        processedImages.push(finalUrl)
      }

      for (let i = 0; i < processedImages.length; i++) {
        await db.productImage.create({
          data: {
            productId: product.id,
            storageUrl: processedImages[i],
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
    const { id, name, description, basePrice, category, stock, status, maxCommission, weight, dimensions, sourceUrl, youtubeUrl, images } = body

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
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl

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
