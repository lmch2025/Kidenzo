import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60; // Autoriser jusqu'à 60 secondes (limite Vercel Hobby)
export const dynamic = 'force-dynamic'; // Ne pas mettre en cache

// Modèles OpenRouter gratuits fiables (tri par rapidité)
const FREE_MODELS = [
  'meta-llama/llama-3.3-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
  'qwen/qwen-2-7b-instruct:free',
  'microsoft/phi-3-mini-128k-instruct:free',
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isValidImageUrl(imgUrl: string) {
  const url = imgUrl.toLowerCase();
  return url.startsWith('http') &&
    !url.includes('sprite') &&
    !url.includes('icon') &&
    !url.includes('logo') &&
    !url.includes('avatar') &&
    !url.includes('flag') &&
    !url.includes('search') &&
    !url.includes('loading') &&
    !url.includes('placeholder') &&
    !url.includes('data:image') &&
    url.length > 30 &&
    !url.includes('50x50') &&
    !url.includes('100x100') &&
    !url.includes('64x64');
}

/**
 * Détecte et corrige le double-encodage UTF-8 (Mojibake).
 * Exemple : "MÃ©langeur" → "Mélangeur"
 */
function fixMojibake(str: string): string {
  // Détecter les patterns Mojibake les plus fréquents (accents français/européens)
  const hasMojibake = ['Ã©', 'Ã¨', 'Ã ', 'Ã§', 'Ã®', 'Ã´', 'Ã¹', 'Ã»', 'Â«', 'Â»', 'Ã‰', 'Ã‡']
    .some(p => str.includes(p))
  if (!hasMojibake) return str

  try {
    // Ré-encoder en Latin-1 puis décoder en UTF-8
    const bytes = new Uint8Array(str.length)
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xFF
    }
    const fixed = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    // Retourner la version fixée seulement si elle ne contient pas de caractères de remplacement
    return fixed.includes('\uFFFD') ? str : fixed
  } catch {
    return str
  }
}


function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&euml;/g, 'ë')
    .replace(/&agrave;/g, 'à')
    .replace(/&acirc;/g, 'â')
    .replace(/&auml;/g, 'ä')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&ouml;/g, 'ö')
    .replace(/&ucirc;/g, 'û')
    .replace(/&uuml;/g, 'ü')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Egrave;/g, 'È')
    .replace(/&Agrave;/g, 'À')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
}

/**
 * Extraction heuristique avancée : JSON-LD + Open Graph + Meta tags + Regex.
 * Ne nécessite pas de LLM, fonctionne hors ligne à partir du HTML brut.
 */
function extractFromHtml(pageHtml: string) {
  // ── Titre ──
  const titleMatch = pageHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = decodeHtmlEntities(titleMatch ? titleMatch[1].trim() : '');

  // ── JSON-LD (structured data) - source la plus fiable ──
  let jsonLdData: Record<string, unknown> | null = null;
  const jsonLdMatches = pageHtml.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const candidates = Array.isArray(data) ? data : [data];
      for (const item of candidates) {
        if (item['@type'] === 'Product' || item?.offers) {
          jsonLdData = item;
          break;
        }
      }
    } catch { /* skip */ }
    if (jsonLdData) break;
  }

  // ── Open Graph tags ──
  const ogTitle = pageHtml.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] || '';
  const ogDesc = pageHtml.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1] || '';
  const ogPrice = pageHtml.match(/<meta[^>]+property="product:price:amount"[^>]+content="([^"]+)"/i)?.[1]
    || pageHtml.match(/<meta[^>]+property="og:price:amount"[^>]+content="([^"]+)"/i)?.[1] || '';
  const ogImage = pageHtml.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] || '';

  // ── Prix depuis patterns communs ──
  const pricePatterns = [
    /["']price["']\s*:\s*([\d.]+)/,
    /data-price=["']([\d.]+)["']/,
    /class=["'][^"']*price[^"']*["'][^>]*>\$?([\d,]+\.?\d*)/i,
    /\$([\d,]+\.?\d*)\s*(?:USD|\/piece|\/set|\/lot)?/i,
    /USD\s*([\d,]+\.?\d*)/,
  ];
  let extractedPrice = parseFloat(ogPrice) || (jsonLdData?.offers as Record<string, unknown> | null)?.price as number || 0;
  if (!extractedPrice) {
    for (const pat of pricePatterns) {
      const m = pageHtml.match(pat);
      if (m) {
        extractedPrice = parseFloat(m[1].replace(',', ''));
        if (extractedPrice > 0 && extractedPrice < 100000) break;
        else extractedPrice = 0;
      }
    }
  }

  // ── Description ──
  const metaDesc = decodeHtmlEntities(pageHtml.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1] || '');
  const rawDesc = String((jsonLdData?.description as string) || ogDesc || metaDesc || '');
  const extractedDesc = decodeHtmlEntities(rawDesc).slice(0, 500);

  // ── Texte brut (pour le LLM) ──
  const text = decodeHtmlEntities(
    pageHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );

  // ── Poids et dimensions ──
  const weightMatch = pageHtml.match(/(?:weight|poids)[^:]*:\s*([\d.]+\s*(?:kg|g|lb|oz))/i);
  const dimMatch = pageHtml.match(/(?:dimensions?|size|taille)[^:]*:\s*([\d.]+\s*[x×]\s*[\d.]+\s*[x×]\s*[\d.]+\s*(?:cm|mm|m|inch|in)?)/i);
  const weight = weightMatch ? weightMatch[1].trim() : '';
  const dimensions = dimMatch ? dimMatch[1].trim() : '';

  // ── Images ──
  const images: string[] = [];
  const seen = new Set<string>();

  // JSON-LD images
  const jldImages = (jsonLdData?.image as string | string[] | undefined);
  if (jldImages) {
    const arr = Array.isArray(jldImages) ? jldImages : [jldImages];
    arr.forEach(img => {
      if (typeof img === 'string' && isValidImageUrl(img) && !seen.has(img)) {
        images.push(img); seen.add(img);
      }
    });
  }
  if (ogImage && isValidImageUrl(ogImage) && !seen.has(ogImage)) {
    images.push(ogImage); seen.add(ogImage);
  }

  // HTML img src
  const imgRegex = /src=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(pageHtml)) !== null) {
    let imgUrl = imgMatch[1];
    if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
    if (isValidImageUrl(imgUrl) && !seen.has(imgUrl)) {
      images.push(imgUrl); seen.add(imgUrl);
    }
  }

  // Raw URLs in HTML (data attributes, inline scripts)
  const rawUrlRegex = /(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?)/gi;
  let rawMatch;
  while ((rawMatch = rawUrlRegex.exec(pageHtml)) !== null) {
    if (isValidImageUrl(rawMatch[1]) && !seen.has(rawMatch[1])) {
      images.push(rawMatch[1]); seen.add(rawMatch[1]);
    }
  }

  // ── Vidéos ──
  const videos: string[] = [];
  const videoSeen = new Set<string>();
  const videoRegex = /(?:src|data-src|data-video-url)=["']([^"']+\.(?:mp4|webm|ogg)(?:\?[^"']*)?)["']/gi;
  let videoMatch;
  while ((videoMatch = videoRegex.exec(pageHtml)) !== null) {
    let videoUrl = videoMatch[1];
    if (videoUrl.startsWith('//')) videoUrl = 'https:' + videoUrl;
    if (videoUrl.startsWith('http') && !videoSeen.has(videoUrl)) {
      videos.push(videoUrl); videoSeen.add(videoUrl);
    }
  }

  return {
    text: fixMojibake(text),
    title: fixMojibake(decodeHtmlEntities(String(jsonLdData?.name || ogTitle || title || ''))).slice(0, 200),
    description: fixMojibake(extractedDesc),
    price: extractedPrice,
    weight,
    dimensions,
    images,
    videos,
  };
}

/**
 * Décode un ArrayBuffer HTML en tenant compte du charset de la réponse.
 * Détecte le charset dans : 1) l'en-tête Content-Type, 2) la balise <meta charset>.
 */
function decodeResponseHtml(buffer: ArrayBuffer, contentType: string): string {
  // 1. Charset depuis l'en-tête Content-Type
  let charset = 'utf-8'
  const ctMatch = contentType.match(/charset=([^;\s]+)/i)
  if (ctMatch) charset = ctMatch[1].toLowerCase().replace(/["']/g, '')

  // Décoder avec fatal:false pour ne jamais lever d'exception sur des bytes invalides
  const safeDecode = (enc: string) => {
    try {
      return new TextDecoder(enc, { fatal: false }).decode(buffer)
    } catch {
      return new TextDecoder('utf-8', { fatal: false }).decode(buffer)
    }
  }

  // Décodage initial
  let html = safeDecode(charset)

  // 2. Chercher le charset dans <meta charset="..."> ou <meta http-equiv="Content-Type"...>
  const metaCharset =
    html.match(/<meta[^>]+charset=["']?([\w-]+)["']?/i)?.[1] ||
    html.match(/<meta[^>]+content=["'][^"']*charset=([\w-]+)["']/i)?.[1]

  if (metaCharset) {
    const detected = metaCharset.toLowerCase().replace(/["']/g, '')
    if (detected !== charset) {
      html = safeDecode(detected)
    }
  }

  return html
}


async function fetchDirect(targetUrl: string) {
  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Direct fetch failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const pageHtml = decodeResponseHtml(buffer, res.headers.get('content-type') || '');
  return extractFromHtml(pageHtml);
}

/**
 * Utilise ScraperAPI pour contourner les protections anti-bot d'Alibaba.
 */
async function fetchViaScraperAPI(targetUrl: string, render = false, timeoutMs = 20000) {
  const scraperApiKey = process.env.SCRAPER_API_KEY || '3565fc05ecea04a4dc89191a4eeab263';
  let scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}&premium=true`;
  if (render) scraperUrl += '&render=true';

  const res = await fetch(scraperUrl, {
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) throw new Error(`ScraperAPI failed (render=${render}): ${res.status}`);
  const buffer = await res.arrayBuffer();
  const pageHtml = decodeResponseHtml(buffer, res.headers.get('content-type') || '');
  return extractFromHtml(pageHtml);
}

/**
 * Tente de réécrire le titre et la description via OpenRouter LLM.
 * Ne lève pas d'erreur - retourne null si tous les modèles échouent.
 */
async function rewriteWithLLM(
  apiKey: string,
  pageTitle: string,
  description: string,
  truncatedText: string,
  isAlibaba: boolean,
  extractedPrice: number,
) {
  const systemPrompt = `Tu es un copywriter spécialisé dans le e-commerce africain (FCFA).
Ta tâche : réécrire le titre et la description d'un produit en français pour le rendre irrésistible.
Réponds UNIQUEMENT avec un JSON valide (sans texte autour) :
{
  "name": "Titre court et accrocheur en français (max 80 caractères)",
  "description": "Description persuasive et émotionnelle (3-4 phrases), donne envie d'acheter",
  "price": ${extractedPrice || 0},
  "category": "une de ces valeurs: alimentation|vetements|electronique|maison|sante|beaute|sport|jouets|automobile|livres|animaux|bricolage|jardin|bebes|bijoux|art|bureau|instruments|immobilier|services_pro|services_perso|education|evenementiel|tourisme|autre"
}`

  const userContent = `Produit ${isAlibaba ? 'Alibaba' : 'e-commerce'} :
Titre original: ${pageTitle}
Description: ${description}
Extrait de page: ${truncatedText.slice(0, 3000)}`

  const models = shuffle(FREE_MODELS)
  for (const model of models) {
    try {
      console.log(`[import-product] Trying LLM model: ${model}`)
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://www.kidenzo.store',
          'X-Title': 'Kidenzo',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(20000), // 20s timeout par modèle
      })

      if (!res.ok) continue;
      const completion = await res.json()
      const text = completion.choices?.[0]?.message?.content || ''
      if (text && text.length > 10) {
        console.log(`[import-product] LLM model ${model} succeeded`)
        return text
      }
    } catch (err) {
      console.warn(`[import-product] LLM model ${model} failed:`, (err as Error).message)
    }
  }
  return null
}

// POST /api/import-product - Import product data from Alibaba/AliExpress URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const hostname = parsedUrl.hostname.toLowerCase()
    const isAlibaba = hostname.includes('alibaba') || hostname.includes('aliexpress') || hostname.includes('1688')

    // ════════════════════════════════════════════════════
    // Étape 1 : Scraping + extraction heuristique du HTML
    // ════════════════════════════════════════════════════
    let scraped: ReturnType<typeof extractFromHtml> | null = null;

    const processScrapeResult = (result: ReturnType<typeof extractFromHtml>) => {
      const ok = !!result.title &&
        !result.title.includes('Product Not Available') &&
        !result.title.includes('Security Check') &&
        !result.title.includes('Just a moment...')
      if (ok) scraped = result;
      return ok;
    }

    // Tentative 1 : fetch direct
    try {
      console.log('[import-product] Trying direct fetch for:', url)
      const directResult = await fetchDirect(url)
      if (processScrapeResult(directResult)) {
        console.log('[import-product] Direct fetch success, title:', directResult.title)
      } else {
        throw new Error('Direct fetch returned anti-bot page')
      }
    } catch (err) {
      // Tentative 2 : ScraperAPI sans JS
      console.warn('[import-product] Direct fetch failed, trying ScraperAPI (no JS):', (err as Error).message)
      try {
        const scraperNoJs = await fetchViaScraperAPI(url, false, 15000)
        if (processScrapeResult(scraperNoJs)) {
          console.log('[import-product] ScraperAPI (no JS) success')
        } else {
          throw new Error('ScraperAPI (no JS) anti-bot page')
        }
      } catch (err2) {
        // Tentative 3 : ScraperAPI avec JS
        console.warn('[import-product] ScraperAPI (no JS) failed, trying with JS:', (err2 as Error).message)
        try {
          const scraperJs = await fetchViaScraperAPI(url, true, 30000)
          if (processScrapeResult(scraperJs)) {
            console.log('[import-product] ScraperAPI (with JS) success')
          } else {
            console.warn('[import-product] ScraperAPI (with JS) hit anti-bot wall.')
          }
        } catch (err3) {
          console.warn('[import-product] ScraperAPI (with JS) failed:', (err3 as Error).message)
        }
      }
    }

    if (!scraped) {
      return NextResponse.json(
        { error: 'Impossible de lire le contenu de cette page. Le site bloque peut-être l\'accès. Essayez un autre lien.' },
        { status: 422 }
      )
    }

    const { title: pageTitle, description: pageDesc, price: heuristicPrice, text: pageText, weight, dimensions, images: extractedImages, videos: extractedVideos } = scraped;

    const uniqueImages = [...new Set(extractedImages)].slice(0, 12)
    const uniqueVideos = [...new Set(extractedVideos)].slice(0, 5)

    // ════════════════════════════════════════════════════
    // Étape 2 : Réécriture LLM (optionnelle, non bloquante)
    // ════════════════════════════════════════════════════
    const apiKey = process.env.OPENROUTER_API_KEY

    let finalName = pageTitle.slice(0, 100)
    let finalDescription = pageDesc || pageText.slice(0, 300)
    let finalPrice = heuristicPrice
    let finalCategory = 'autre'

    if (apiKey) {
      const llmResponse = await rewriteWithLLM(
        apiKey,
        pageTitle,
        pageDesc,
        pageText,
        isAlibaba,
        heuristicPrice,
      )

      if (llmResponse) {
        try {
          const jsonMatch = llmResponse.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            if (parsed.name) finalName = String(parsed.name).slice(0, 100)
            if (parsed.description) finalDescription = String(parsed.description)
            if (parsed.price && Number(parsed.price) > 0) finalPrice = Number(parsed.price)
            if (parsed.category) finalCategory = String(parsed.category)
          }
        } catch {
          console.warn('[import-product] LLM JSON parse failed, using heuristic data')
        }
      } else {
        console.warn('[import-product] LLM unavailable, using heuristic extraction only')
        // Détection de catégorie par mots-clés (titre + URL + texte)
        const haystack = (pageTitle + ' ' + url + ' ' + pageText.slice(0, 500)).toLowerCase()
        if (/blender|mixer|juicer|cuisine|cook|kitchen|ménager|électroménager/.test(haystack)) finalCategory = 'maison'
        else if (/shirt|dress|pants|shoes|clothes|vêtement|robe|fashion|apparel|clothing/.test(haystack)) finalCategory = 'vetements'
        else if (/phone|laptop|tablet|computer|electronic|smartphone|headphone|earphone/.test(haystack)) finalCategory = 'electronique'
        else if (/beauty|cream|skin|hair|cosmetic|makeup|parfum|skincare/.test(haystack)) finalCategory = 'beaute'
        else if (/sport|gym|fitness|yoga|football|basketball|running/.test(haystack)) finalCategory = 'sport'
        else if (/toy|jouet|child|kid|baby|enfant|bébé/.test(haystack)) finalCategory = 'jouets'
        else if (/car|auto|vehicle|moto|wheel|tire|pneu/.test(haystack)) finalCategory = 'automobile'
        else if (/garden|jardin|plant|flower|outdoor/.test(haystack)) finalCategory = 'jardin'
      }
    }

    const result = {
      name: finalName,
      description: finalDescription,
      price: finalPrice,
      images: uniqueImages,
      videos: uniqueVideos,
      category: finalCategory,
      weight,
      dimensions,
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
