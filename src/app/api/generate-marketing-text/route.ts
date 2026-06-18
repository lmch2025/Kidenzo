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

// ─── Fisher-Yates Shuffle ──────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── System Prompt ─────────────────────────────────────────────────
function buildSystemPrompt(type: 'product' | 'recruitment' = 'product'): string {
  const styles = [
    'passionnant et irrésistible',
    'émotionnel et chaleureux',
    'urgent et persuasif',
    'élégant et sophistiqué',
    'décontracté et authentique',
    'enthousiaste et convaincant',
    'mystérieux et intrigant',
  ]
  const style = styles[Math.floor(Math.random() * styles.length)]

  if (type === 'recruitment') {
    return `Tu es un leader charismatique et recruteur de génie en Afrique. 
Tu rédiges des textes courts, motivants et émotionnels pour inviter les gens à rejoindre ton équipe.
Ton style aujourd'hui : ${style}.

RÈGLES STRICTES :
- Maximum 2 phrases (15-30 mots total)
- Pas de hashtags ni d'emojis sauf 1 seul à la fin
- Langue : FRANÇAIS uniquement
- Le texte doit donner envie de rejoindre l'équipe IMMÉDIATEMENT pour gagner de l'argent depuis chez soi
- Termine par un appel à l'action
- Réponds UNIQUEMENT avec le texte marketing, aucun préfixe ni explication`
  }

  return `Tu es un copywriter marketing de génie, spécialiste du commerce en Afrique. 
Tu rédiges des textes courts, accrocheurs, vendeurs et émotionnels pour des produits.
Ton style aujourd'hui : ${style}.

RÈGLES STRICTES :
- Maximum 2 phrases (15-30 mots total)
- Pas de hashtags ni d'emojis sauf 1 seul à la fin
- Langue : FRANÇAIS uniquement
- Le texte doit donner envie d'acheter IMMÉDIATEMENT
- Inclus le nom du produit et le prix
- Termine par un appel à l'action
- Réponds UNIQUEMENT avec le texte marketing, aucun préfixe ni explication`
}

// POST /api/generate-marketing-text
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, basePrice, commissionPct, description, category, shareLink, type = 'product' } = body

    if (type !== 'recruitment' && (!productName || basePrice === undefined)) {
      return NextResponse.json(
        { error: 'productName and basePrice are required for products' },
        { status: 400 }
      )
    }

    let userPrompt = ''
    if (type === 'recruitment') {
      userPrompt = `Rédige un texte marketing court et hyper motivant pour recruter un nouveau recommandeur.
L'objectif est de lui faire comprendre qu'il peut gagner de l'argent facilement depuis son téléphone, sans aucun investissement.
${shareLink ? `- Lien d'inscription : ${shareLink}` : ''}

Texte de recrutement :`
    } else {
      const finalPrice = basePrice * (1 + (commissionPct || 0) / 100)
      userPrompt = `Rédige un texte marketing court et percutant pour ce produit :
- Nom : ${productName}
- Prix client : ${finalPrice} FCFA
- Catégorie : ${category || 'général'}
${description ? `- Description : ${description}` : ''}
${shareLink ? `- Lien : ${shareLink}` : ''}

Texte marketing :`
    }

    // Shuffle models to ensure diversity across calls
    const modelQueue = shuffle(FREE_MODELS)
    let lastError: Error | null = null

    // Try each model until one succeeds
    for (const model of modelQueue) {
      try {
        const apiKey = process.env.OPENROUTER_API_KEY
        if (!apiKey) {
          throw new Error('OPENROUTER_API_KEY is missing from environment variables')
        }

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
              { role: 'system', content: buildSystemPrompt(type) },
              { role: 'user', content: userPrompt },
            ],
            // max_tokens: 150
          })
        })

        if (!openRouterRes.ok) {
          const errText = await openRouterRes.text()
          throw new Error(`OpenRouter API error: ${openRouterRes.status} - ${errText}`)
        }

        const completion = await openRouterRes.json()
        const text = completion.choices?.[0]?.message?.content?.trim()

        if (text && text.length > 5) {
          return NextResponse.json({
            success: true,
            text,
            model,
            modelsTried: modelQueue.indexOf(model) + 1,
          })
        }

        // Empty response — try next model
        lastError = new Error(`Empty response from ${model}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[generate-marketing-text] Model ${model} failed: ${msg}`)
        lastError = err instanceof Error ? err : new Error(msg)
        // Continue to next model
      }
    }

    let fallbackText = ''
    if (type === 'recruitment') {
      fallbackText = `🚀 Envie de gagner de l'argent depuis ton téléphone sans investissement ? Rejoins mon équipe dès aujourd'hui et commence à générer des revenus réguliers ! Inscris-toi ici 👉`
    } else {
      const finalPrice = basePrice * (1 + (commissionPct || 0) / 100)
      fallbackText = `🔥 ${productName} à seulement ${finalPrice} FCFA ! Ne ratez pas cette offre exceptionnelle, commandez maintenant ! 👉`
    }

    // All models failed — return a fallback
    return NextResponse.json({
      success: false,
      text: fallbackText,
      model: 'fallback',
      modelsTried: modelQueue.length,
      error: lastError?.message || 'All models failed',
    })
  } catch (error) {
    console.error('[generate-marketing-text] Fatal error:', error)
    return NextResponse.json(
      { error: 'Failed to generate marketing text' },
      { status: 500 }
    )
  }
}
