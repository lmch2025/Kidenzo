import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const FREE_MODELS = [
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'google/gemma-4-26b-a4b-it:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'meta-llama/llama-4-maverick:free',
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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

    let slug = generateSlug(product.name)
    let attempts = 0
    while (await db.miniSite.findUnique({ where: { slug } })) {
      slug = generateSlug(product.name)
      attempts++
      if (attempts > 10) throw new Error('Failed to generate unique slug')
    }

    // Generate marketing pitch with AI via OpenRouter
    let marketingPitch = null
    try {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) throw new Error('OPENROUTER_API_KEY missing')

      const systemPrompt = `Tu es un copywriter d'élite spécialisé dans le commerce en Afrique. 
Tu rédiges la landing page parfaite (Mini-Site) pour un produit.
RÈGLES :
- Maximum 3-4 lignes percutantes
- Décris les bénéfices (pas juste les caractéristiques)
- Donne un sentiment d'urgence
- Termine par un appel à l'action fort`
      
      const userPrompt = `Produit : ${product.name}
Description d'origine : ${product.description}
Prix : ${product.basePrice} FCFA
Rédige le texte de vente :`

      const modelQueue = shuffle(FREE_MODELS)
      for (const model of modelQueue) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://recopay.com',
              'X-Title': 'RecoPay',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
            }),
          })
          if (!res.ok) throw new Error(`OpenRouter ${res.status}`)
          const completion = await res.json()
          const text = completion.choices?.[0]?.message?.content?.trim()
          if (text && text.length > 10) {
            marketingPitch = text
            break
          }
        } catch (err) {
          console.warn(`[mini-sites] Model ${model} failed:`, err)
        }
      }
    } catch (e) {
      console.error('Failed to generate marketing pitch', e)
    }

    const miniSite = await db.miniSite.create({
      data: {
        productId,
        slug,
        marketingPitch,
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
