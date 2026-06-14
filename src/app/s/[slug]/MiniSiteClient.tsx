'use client'

import MiniSiteView from '@/components/MiniSiteView'

export default function MiniSiteClient({ slug }: { slug: string }) {
  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0533] via-[#2d1b4e] to-[#4a1942]">
        <p className="text-white/60">Produit introuvable</p>
      </div>
    )
  }

  return <MiniSiteView slug={slug} />
}
