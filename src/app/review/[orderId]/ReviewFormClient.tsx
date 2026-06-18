'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

export default function ReviewFormClient({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("S'il te plaît, choisis une note (les étoiles).")
      return
    }
    
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, rating, comment }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.')
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Erreur de connexion. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-xl font-bold text-emerald-400 mb-2">Avis enregistré !</h2>
        <p className="text-white/70">Merci beaucoup pour ton retour.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-2xl p-6">
        <p className="text-center font-medium mb-4 text-lg">Es-tu satisfait du produit ?</p>
        <div className="flex justify-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-10 h-10 ${
                  star <= (hoverRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-white/20 fill-white/20'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Laisse un petit mot (optionnel)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="J'ai beaucoup aimé..."
          className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || rating === 0}
        className="w-full h-14 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg disabled:opacity-50 transition-transform active:scale-95"
      >
        {loading ? 'Envoi en cours...' : 'Envoyer mon avis'}
      </button>
    </div>
  )
}
