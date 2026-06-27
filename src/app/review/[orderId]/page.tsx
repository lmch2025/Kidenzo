import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import ReviewFormClient from './ReviewFormClient'

export default async function ReviewPage(props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
  const { orderId } = params
  
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      miniSite: {
        include: {
          product: {
            include: { images: true }
          }
        }
      },
      review: true
    }
  })

  if (!order) {
    notFound()
  }

  const product = order.miniSite.product
  const productImage = product.images?.[0]?.storageUrl || '/product-hero.webp'
  const alreadyReviewed = !!order.review

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4">
      <div className="w-full max-w-md mt-10">
        <h1 className="text-2xl font-bold text-center mb-6">Ton avis est important</h1>
        
        <div className="bg-white/10 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <img src={productImage} alt={product.name} className="w-16 h-16 rounded-xl object-contain bg-black/10" />
          <div>
            <p className="font-semibold line-clamp-1">{product.name}</p>
            <p className="text-sm text-white/50">Commande de {order.customerName}</p>
          </div>
        </div>

        {alreadyReviewed ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-xl font-bold text-emerald-400 mb-2">Merci !</h2>
            <p className="text-white/70">Tu as déjà donné ton avis pour ce produit.</p>
          </div>
        ) : (
          <ReviewFormClient orderId={order.id} />
        )}
      </div>
    </div>
  )
}
