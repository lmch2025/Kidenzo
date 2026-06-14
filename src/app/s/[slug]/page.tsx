import { Metadata } from 'next'
import { db } from '@/lib/db'
import MiniSiteClient from './MiniSiteClient'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const miniSite = await db.miniSite.findUnique({
      where: { slug },
      include: {
        product: {
          include: {
            images: { orderBy: { position: 'asc' } },
            owner: { select: { name: true } },
          },
        },
      },
    })

    if (!miniSite) return { title: 'Produit introuvable - Kidenzo' }

    const product = miniSite.product
    const imageUrl = product.images?.[0]?.storageUrl || ''

    return {
      title: `${product.name} - Kidenzo`,
      description: product.description?.substring(0, 160) || `Achetez ${product.name} au meilleur prix`,
      openGraph: {
        title: product.name,
        description: product.description?.substring(0, 160) || '',
        images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
        url: `/s/${slug}`,
        type: 'website',
        siteName: 'Kidenzo',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description?.substring(0, 160) || '',
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch {
    return { title: 'Kidenzo' }
  }
}

export default async function MiniSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <MiniSiteClient slug={slug} />
}
