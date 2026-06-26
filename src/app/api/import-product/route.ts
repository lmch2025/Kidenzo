import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60; // Autoriser jusqu'à 60 secondes (limite Vercel Hobby)
export const dynamic = 'force-dynamic'; // Ne pas mettre en cache

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

/**
 * Tente de lire le contenu d'une page via Jina Reader (proxy anti-blocage gratuit).
 * Jina Reader contourne les protections anti-bot d'Alibaba/AliExpress.
 * Retourne le contenu en texte Markdown propre.
 */
async function fetchViaJinaReader(targetUrl: string): Promise<{ text: string; images: string[] }> {
  const jinaUrl = `https://r.jina.ai/${targetUrl}`
  const res = await fetch(jinaUrl, {
    headers: {
      'Accept': 'text/plain',
      'X-No-Cache': 'true',
    },
    signal: AbortSignal.timeout(30000), // 30s timeout
  })

  if (!res.ok) {
    throw new Error(`Jina Reader failed: ${res.status}`)
  }

  const text = await res.text()

  // Extraire les URLs d'images du contenu Markdown retourné par Jina
  const markdownImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g
  const images: string[] = []
  let match
  while ((match = markdownImageRegex.exec(text)) !== null) {
    let imgUrl = match[1]
    if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl
    if (
      imgUrl.startsWith('http') &&
      !imgUrl.includes('sprite') &&
      !imgUrl.includes('icon') &&
      !imgUrl.includes('logo') &&
      !imgUrl.includes('avatar') &&
      !imgUrl.includes('flag') &&
      !imgUrl.includes('loading') &&
      !imgUrl.includes('placeholder') &&
      imgUrl.length > 30
    ) {
      images.push(imgUrl)
    }
  }

  return { text, images }
}

/**
 * Fallback : Fetch direct du HTML (fonctionne en local, mais peut être bloqué en production).
 */
async function fetchDirect(targetUrl: string): Promise<{ text: string; title: string; images: string[] }> {
  const fetchRes = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!fetchRes.ok) throw new Error(`Direct fetch failed: ${fetchRes.status}`)
  const pageHtml = await fetchRes.text()

  const titleMatch = pageHtml.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : ''

  // Extraire le texte brut du HTML
  const text = pageHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

  // Extraire les images du HTML
  const imgRegex = /src=["']([^"']+\.(jpg|jpeg|png|webp)(\?[^"']*)?)\s*["']/gi
  const images: string[] = []
  let imgMatch
  while ((imgMatch = imgRegex.exec(pageHtml)) !== null) {
    let imgUrl = imgMatch[1]
    if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl
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
      images.push(imgUrl)
    }
  }

  return { text, title, images }
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

    // ========================================================================
    // Step 1: Lire le contenu de la page
    // Stratégie : Jina Reader d'abord (contourne les anti-bots), puis fallback direct
    // ========================================================================
    let pageText = ''
    let pageTitle = ''
    let extractedImages: string[] = []

    // --- Tentative 1 : Jina Reader (proxy anti-blocage) ---
    try {
      console.log('[import-product] Trying Jina Reader for:', url)
      const jinaResult = await fetchViaJinaReader(url)
      pageText = jinaResult.text

      // Vérifier que Jina a retourné du contenu exploitable (pas une page de blocage)
      if (pageText.length > 200) {
        console.log('[import-product] Jina Reader success, text length:', pageText.length)
        extractedImages = jinaResult.images

        // Extraire le titre du contenu Jina (première ligne commençant par #)
        const titleLine = pageText.split('\n').find(l => l.startsWith('# ') || l.startsWith('Title:'))
        if (titleLine) {
          pageTitle = titleLine.replace(/^#\s*/, '').replace(/^Title:\s*/i, '').trim()
        }
      } else {
        console.warn('[import-product] Jina Reader returned too little content, falling back')
        pageText = '' // Reset pour déclencher le fallback
      }
    } catch (jinaErr) {
      console.warn('[import-product] Jina Reader failed:', jinaErr)
    }

    // --- Tentative 2 : Fetch direct (fallback) ---
    if (!pageText) {
      try {
        console.log('[import-product] Trying direct fetch for:', url)
        const directResult = await fetchDirect(url)
        pageText = directResult.text
        pageTitle = directResult.title
        extractedImages = directResult.images
        console.log('[import-product] Direct fetch success, text length:', pageText.length)
      } catch (directErr) {
        console.warn('[import-product] Direct fetch also failed:', directErr)
      }
    }

    // Si aucune méthode n'a fonctionné
    if (!pageText || pageText.length < 50) {
      return NextResponse.json(
        { error: 'Impossible de lire le contenu de cette page. Le site bloque peut-être l\'accès. Essayez un autre lien.' },
        { status: 422 }
      )
    }

    // Limiter le texte pour ne pas dépasser les limites de tokens du LLM
    const truncatedText = pageText.slice(0, 10000)
    const uniqueImages = [...new Set(extractedImages)].slice(0, 10)

    // ========================================================================
    // Step 2: Utiliser le LLM pour extraire et reformuler les données produit
    // ========================================================================
    const systemPrompt = `Tu es un copywriter d'élite spécialisé dans le e-commerce africain.
Ta mission est d'extraire les données d'une page produit (Alibaba, etc.) et de réécrire complètement le titre et la description pour les rendre irrésistibles à l'achat.
Tu dois retourner UNIQUEMENT un JSON valide, sans aucun texte supplémentaire :
{
  "name": "Nouveau titre accrocheur et court (en français)",
  "description": "Nouveau texte de vente persuasif, émotionnel et très vendeur (3-4 phrases). Donne envie d'acheter immédiatement.",
  "price": nombre (prix original en USD, convertir si nécessaire, sans symbole),
  "category": "alimentation|vetements|electronique|maison|sante|beaute|sport|jouets|automobile|livres|animaux|bricolage|jardin|bebes|bijoux|art|bureau|instruments|immobilier|services_pro|services_perso|education|evenementiel|tourisme|autre",
  "weight": "Poids avec unité (ex: 500g, 1.2kg) ou chaîne vide si inconnu",
  "dimensions": "Dimensions LxLxH avec unité (ex: 30x20x10cm) ou chaîne vide si inconnu"
}

Règles:
- Le prix doit être un nombre (float), en dollars US si indiqué
- La catégorie doit correspondre à l'une des valeurs listées (ex: 'maison', 'electronique', 'vetements', 'alimentation', etc.)
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
        console.log(`[import-product] Trying model: ${model}`)
        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://www.kidenzo.store",
            "X-Title": "Kidenzo"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: `Voici le contenu d'une page produit ${isAlibaba ? 'Alibaba/AliExpress' : 'e-commerce'}:\n\nTitre: ${pageTitle}\n\nContenu:\n${truncatedText}\n\nExtrais les données produit au format JSON demandé.`
              }
            ]
          }),
          signal: AbortSignal.timeout(25000), // 25s timeout par modèle
        })

        if (!openRouterRes.ok) {
          const errBody = await openRouterRes.text().catch(() => '')
          throw new Error(`OpenRouter API error: ${openRouterRes.status} - ${errBody.slice(0, 200)}`)
        }

        const completion = await openRouterRes.json()
        const text = completion.choices?.[0]?.message?.content || ''
        
        if (text && text.length > 10) {
          llmResponse = text
          console.log(`[import-product] Model ${model} succeeded`)
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
      if (!jsonMatch) throw new Error('No JSON found in LLM response')
      productData = JSON.parse(jsonMatch[0])
    } catch {
      // Fallback: construct from what we have
      productData = {
        name: pageTitle.slice(0, 100),
        description: truncatedText.slice(0, 300),
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
