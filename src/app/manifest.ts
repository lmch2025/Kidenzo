import { headers } from 'next/headers'
import type { MetadataRoute } from 'next'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const isWallet = host.startsWith('wallet.')

  if (isWallet) {
    return {
      name: 'Kidenzo Wallet',
      short_name: 'Wallet',
      description: 'Gérez vos crédits et votre épargne de façon flexible.',
      start_url: '/',
      display: 'standalone',
      background_color: '#0a0118',
      theme_color: '#ec4899',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
      ],
    }
  }

  return {
    name: 'Kidenzo Recommandation',
    short_name: 'Kidenzo',
    description: 'Plateforme de Recommandation et Commerce. Gagnez des commissions.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#f97316',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
