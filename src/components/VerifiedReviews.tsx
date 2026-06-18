'use client'

import { useEffect, useState } from 'react'
import { Star, ShieldCheck } from 'lucide-react'

interface Review {
  id: string
  customerName: string
  rating: number
  comment: string | null
  createdAt: string
}

interface ReviewsResponse {
  reviews: Review[]
  totalReviews: number
  averageRating: number
}

export default function VerifiedReviews({ productId }: { productId: string }) {
  const [data, setData] = useState<ReviewsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/products/${productId}/reviews`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [productId])

  if (loading || !data || data.reviews.length === 0) {
    return null
  }

  const { reviews, totalReviews, averageRating } = data

  return (
    <div className="mt-8 pt-8 border-t border-white/10">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-6 h-6 text-emerald-400" />
        <h2 className="text-xl font-bold text-white/90">Avis Clients Vérifiés</h2>
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-3xl font-black text-white/90">{averageRating.toFixed(1)}<span className="text-lg text-white/40">/5</span></p>
          <p className="text-xs text-white/50">{totalReviews} avis vérifié{totalReviews > 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= Math.round(averageRating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-white/20 fill-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-white/90">{review.customerName}</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Achat vérifié
                </p>
              </div>
              <p className="text-xs text-white/40">
                {new Date(review.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= review.rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-white/20 fill-white/20'
                  }`}
                />
              ))}
            </div>

            {review.comment && (
              <p className="text-sm text-white/70 mt-2 leading-relaxed">
                "{review.comment}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
