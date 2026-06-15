import { NextRequest, NextResponse } from 'next/server'

const FREE_MODELS = [
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'google/gemma-4-26b-a4b-it:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'cognitivecomputations/dolphin-mistral-24b-venice-edition:free'
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// POST /api/import-product - Import product data from Alibaba/AliExpress URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const hostname = parsedUrl.hostname.toLowerCase()
    const isAlibaba = hostname.includes('alibaba') || hostname.includes('aliexpress') || hostname.includes('1688')

    // Step 1: Read the web page content
    let pageHtml = ''
    let pageTitle = ''

    try {
      const fetchRes = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      })
      if (!fetchRes.ok) throw new Error('Fetch failed')
      pageHtml = await fetchRes.text()

      const titleMatch = pageHtml.match(/<title[^>]*>([^<]+)<\/title>/i)
      pageTitle = titleMatch ? titleMatch[1].trim() : ''
    } catch (err) {
      console.warn("Fetch failed, continuing with empty HTML", err)
      return NextResponse.json(
        { error: 'Impossible de lire le contenu de cette page. Vérifiez l\'URL ou essayez un autre site.' },
        { status: 422 }
      )
    }

    // Extract plain text for LLM processing (limit to avoid token limits)
    const plainText = pageHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)

    // Extract all image URLs from the page
    const imgRegex = /src=["']([^"']+\.(jpg|jpeg|png|webp)(\?[^"']*)?)["']/gi
    const allImages: string[] = []
    let imgMatch
    while ((imgMatch = imgRegex.exec(pageHtml)) !== null) {
      let imgUrl = imgMatch[1]
      
      // Handle protocol-relative URLs used by Alibaba
      if (imgUrl.startsWith('//')) {
        imgUrl = 'https:' + imgUrl
      }

      // Filter out tiny icons, logos, and non-product images
      if (
        imgUrl.startsWith('http') &&
        !imgUrl.includes('sprite') &&
        !imgUrl.includes('icon') &&
        !imgUrl.includes('logo') &&
        !imgUrl.includes('avatar') &&
        !imgUrl.includes('flag') &&
        !imgUrl.includes('search') &&
        !imgUrl.includes('loading') &&
        !imgUrl.includes('placeholder') &&
        !imgUrl.includes('data:image') &&
        imgUrl.length > 30
      ) {
        allImages.push(imgUrl)
      }
    }

    // Deduplicate images
    const uniqueImages = [...new Set(allImages)].slice(0, 10)

    // Step 2: Use LLM to extract structured product data
    const systemPrompt = `Tu es un copywriter d'élite spécialisé dans le e-commerce africain.
Ta mission est d'extraire les données d'une page produit (Alibaba, etc.) et de réécrire complètement le titre et la description pour les rendre irrésistibles à l'achat.
Tu dois retourner UNIQUEMENT un JSON valide, sans aucun texte supplémentaire :
{
  "name": "Nouveau titre accrocheur et court (en français)",
  "description": "Nouveau texte de vente persuasif, émotionnel et très vendeur (3-4 phrases). Donne envie d'acheter immédiatement.",
  "price": nombre (prix original en USD, convertir si nécessaire, sans symbole),
  "category": "alimentation|textile|boisson|electronique|beaute|autre",
  "weight": "Poids avec unité (ex: 500g, 1.2kg) ou chaîne vide si inconnu",
  "dimensions": "Dimensions LxLxH avec unité (ex: 30x20x10cm) ou chaîne vide si inconnu"
}

Règles:
- Le prix doit être un nombre (float), en dollars US si indiqué
- La catégorie doit correspondre à l'une des valeurs listées
- Si une information n'est pas trouvée, utilise une valeur par défaut raisonnable
- Réponds UNIQUEMENT avec le JSON, aucun texte avant ou après`

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is missing from environment variables')
    }

    const modelQueue = shuffle(FREE_MODELS)
    let llmResponse = ''

    for (const model of modelQueue) {
      try {
        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://recopay.com", // Replace with your actual domain
            "X-Title": "RecoPay"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: `Voici le contenu d'une page produit ${isAlibaba ? 'Alibaba/AliExpress' : 'e-commerce'}:\n\nTitre: ${pageTitle}\n\nContenu:\n${plainText}\n\nExtrais les données produit au format JSON demandé.`
              }
            ]
          })
        })

        if (!openRouterRes.ok) {
          throw new Error(`OpenRouter API error: ${openRouterRes.status}`)
        }

        const completion = await openRouterRes.json()
        const text = completion.choices?.[0]?.message?.content || ''
        
        if (text && text.length > 10) {
          llmResponse = text
          break
        }
      } catch (err) {
        console.warn(`[import-product] Model ${model} failed:`, err)
      }
    }

    if (!llmResponse) {
      throw new Error('All fallback models failed to generate response.')
    }

    // Parse the LLM response as JSON
    let productData: Record<string, unknown>
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      productData = JSON.parse(jsonMatch[0])
    } catch {
      // Fallback: construct from what we have
      productData = {
        name: pageTitle.slice(0, 100),
        description: plainText.slice(0, 300),
        price: 0,
        category: 'autre',
        weight: '',
        dimensions: '',
      }
    }

    // Build the result
    const result = {
      name: String(productData.name || pageTitle.slice(0, 100)),
      description: String(productData.description || ''),
      price: Number(productData.price) || 0,
      images: uniqueImages,
      category: String(productData.category || 'autre'),
      weight: String(productData.weight || ''),
      dimensions: String(productData.dimensions || ''),
      sourceUrl: url,
    }

    return NextResponse.json({ product: result })
  } catch (error) {
    console.error('Import product error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'importation du produit. Vérifiez l\'URL et réessayez.' },
      { status: 500 }
    )
  }
}
