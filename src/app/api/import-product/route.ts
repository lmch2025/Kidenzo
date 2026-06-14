import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

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
    const zai = await ZAI.create()
    const pageResult = await zai.functions.invoke('page_reader', { url })

    if (!pageResult?.data?.html && !pageResult?.data?.title) {
      return NextResponse.json(
        { error: 'Impossible de lire le contenu de cette page. Vérifiez l\'URL.' },
        { status: 422 }
      )
    }

    const pageTitle = pageResult.data.title || ''
    const pageHtml = pageResult.data.html || ''

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
      const imgUrl = imgMatch[1]
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
    const systemPrompt = `Tu es un assistant spécialisé dans l'extraction de données produit depuis des sites e-commerce (Alibaba, AliExpress, etc.). 
Tu dois extraire les informations suivantes du texte fourni et les retourner UNIQUEMENT au format JSON valide, sans aucun texte supplémentaire :
{
  "name": "Nom du produit (en français si possible, sinon en anglais)",
  "description": "Description détaillée du produit en français, 2-3 phrases accrocheuses pour la vente",
  "price": nombre (prix en USD, convertir si nécessaire, sans symbole),
  "category": "alimentation|textile|boisson|electronique|beaute|autre",
  "weight": "Poids avec unité (ex: 500g, 1.2kg) ou chaîne vide si inconnu",
  "dimensions": "Dimensions LxLxH avec unité (ex: 30x20x10cm) ou chaîne vide si inconnu"
}

Règles:
- Le prix doit être un nombre (float), en dollars US si indiqué
- La catégorie doit correspondre à l'une des valeurs listées
- Si une information n'est pas trouvée, utilise une valeur par défaut raisonnable
- La description doit être vendeuse et en français
- Réponds UNIQUEMENT avec le JSON, aucun texte avant ou après`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        {
          role: 'user',
          content: `Voici le contenu d'une page produit ${isAlibaba ? 'Alibaba/AliExpress' : 'e-commerce'}:\n\nTitre: ${pageTitle}\n\nContenu:\n${plainText}\n\nExtrais les données produit au format JSON demandé.`
        }
      ],
      thinking: { type: 'disabled' }
    })

    const llmResponse = completion.choices[0]?.message?.content || ''

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
