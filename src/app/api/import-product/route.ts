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
 * Utilise ScraperAPI pour contourner les protections anti-bot d'Alibaba.
 * Rend le JavaScript de la page pour assurer que les données sont présentes.
 */
async function fetchViaScraperAPI(targetUrl: string): Promise<{ text: string; title: string; images: string[], videos: string[] }> {
  const scraperApiKey = process.env.SCRAPER_API_KEY || '3565fc05ecea04a4dc89191a4eeab263';
  
  // Utilisation de render=true pour forcer l'exécution du JavaScript (nécessaire pour Alibaba)
  const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}&render=true`;
  
  const res = await fetch(scraperUrl, {
    signal: AbortSignal.timeout(45000), // 45s car le rendu JS via ScraperAPI peut prendre du temps
  });

  if (!res.ok) {
    throw new Error(`ScraperAPI failed: ${res.status}`);
  }

  const pageHtml = await res.text();

  const titleMatch = pageHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

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
    .trim();

  // Extraire les images du HTML
  const imgRegex = /src=["']([^"']+\.(jpg|jpeg|png|webp)(\?[^"']*)?)\s*["']/gi;
  const images: string[] = [];
  let imgMatch;
  while ((imgMatch = imgRegex.exec(pageHtml)) !== null) {
    let imgUrl = imgMatch[1];
    if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
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
      images.push(imgUrl);
    }
  }

  // Extraire les vidéos du HTML
  const videoRegex = /(?:src|data-src|data-video-url|poster)=["']([^"']+\.(mp4|webm|ogg)(\?[^"']*)?)\s*["']/gi;
  const videos: string[] = [];
  let videoMatch;
  while ((videoMatch = videoRegex.exec(pageHtml)) !== null) {
    let videoUrl = videoMatch[1];
    if (videoUrl.startsWith('//')) videoUrl = 'https:' + videoUrl;
    if (videoUrl.startsWith('http') && videoUrl.length > 20) {
      videos.push(videoUrl);
    }
  }

  return { text, title, images, videos };
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
    // Step 1: Lire le contenu de la page via ScraperAPI
    // ========================================================================
    let pageText = ''
    let pageTitle = ''
    let extractedImages: string[] = []
    let extractedVideos: string[] = []

    try {
      console.log('[import-product] Trying ScraperAPI for:', url)
      const scrapeResult = await fetchViaScraperAPI(url)
      
      // Vérifier que le titre n'est pas la page de blocage anti-bot d'Alibaba
      if (scrapeResult.title && !scrapeResult.title.includes('Product Not Available') && !scrapeResult.title.includes('Security Check')) {
        pageText = scrapeResult.text
        pageTitle = scrapeResult.title
        extractedImages = scrapeResult.images
        extractedVideos = scrapeResult.videos
        console.log('[import-product] ScraperAPI success, text length:', pageText.length)
      } else {
        console.warn('[import-product] ScraperAPI hit anti-bot wall or product not found.')
      }
    } catch (err) {
      console.warn('[import-product] ScraperAPI failed:', err)
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
    const uniqueVideos = [...new Set(extractedVideos)].slice(0, 5)

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
      videos: uniqueVideos,
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
