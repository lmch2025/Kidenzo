import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET /api/settings ──────────────────────────────────────────────
// Returns public-facing app configuration (no auth required)
export async function GET() {
  try {
    const configs = await db.systemConfig.findMany({
      where: {
        key: {
          in: ['default_ppc_rate', 'app_name', 'currency'],
        },
      },
    })

    const map = configs.reduce<Record<string, string>>((acc, c) => {
      acc[c.key] = c.value
      return acc
    }, {})

    return NextResponse.json({
      ppcRate: parseFloat(map['default_ppc_rate'] ?? '5'),
      appName: map['app_name'] ?? 'Kidenzo',
      currency: map['currency'] ?? 'FCFA',
    })
  } catch {
    // Always return a sensible fallback — never block the UI
    return NextResponse.json({
      ppcRate: 5,
      appName: 'Kidenzo',
      currency: 'FCFA',
    })
  }
}
