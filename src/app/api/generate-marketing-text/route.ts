import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// ─── 7 Free OpenRouter Models ─────────────────────────────────────
// Ordered by diversity potential — each call shuffles to get different models first
const FREE_MODELS = [
  'meta-llama/llama-4-maverick:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-4-scout:free',
  'nvidia/llama-3.1-nemotron-70b-instruct:free',
  'qwen/qwen3-8b:free',
  'microsoft/phi-4:free',
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
function buildSystemPrompt(): string {
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
    const { productName, basePrice, commissionPct, description, category, shareLink } = body

    if (!productName || basePrice === undefined) {
      return NextResponse.json(
        { error: 'productName and basePrice are required' },
        { status: 400 }
      )
    }

    const finalPrice = basePrice * (1 + (commissionPct || 0) / 100)
    const userPrompt = `Rédige un texte marketing court et percutant pour ce produit :
- Nom : ${productName}
- Prix client : ${finalPrice} FCFA
- Catégorie : ${category || 'général'}
${description ? `- Description : ${description}` : ''}
${shareLink ? `- Lien : ${shareLink}` : ''}

Texte marketing :`

    // Shuffle models to ensure diversity across calls
    const modelQueue = shuffle(FREE_MODELS)
    let lastError: Error | null = null

    const zai = await ZAI.create()

    // Try each model until one succeeds
    for (const model of modelQueue) {
      try {
        const completion = await zai.chat.completions.create({
          model,
          messages: [
            { role: 'assistant', content: buildSystemPrompt() },
            { role: 'user', content: userPrompt },
          ],
          thinking: { type: 'disabled' },
        })

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

    // All models failed — return a fallback
    return NextResponse.json({
      success: false,
      text: `🔥 ${productName} à seulement ${finalPrice} FCFA ! Ne ratez pas cette offre exceptionnelle, commandez maintenant ! 👉`,
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
