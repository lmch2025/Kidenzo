'use client'

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion'
import { Package, TrendingUp, Share2, Loader2, X } from 'lucide-react'
import { formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

// Animated price with spring
function AnimatedPrice({ value }: { value: number }) {
  const spring = useSpring(useMotionValue(value), { stiffness: 300, damping: 30 })
  const display = useTransform(spring, (latest) => formatPrice(Math.round(latest)))

  // Update spring value when prop changes
  useMemo(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}

// ─── Commission Popup — Elegant modal for non-digital audience ────
export default function CommissionPopup({
  open,
  onClose,
  product,
  onShare,
  isSaving,
  initialCommission,
}: {
  open: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    basePrice: number
    maxCommission: number
    recommenderMaxCommission?: number
    description?: string
    imageUrl?: string
    miniSite?: { id: string; slug: string } | null
  } | null
  onShare: (productId: string, miniSiteId: string, commissionPct: number) => void
  isSaving: boolean
  initialCommission?: number | null
}) {
  const [commission, setCommission] = useState(initialCommission ?? 10)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Reset commission when product changes
  const productId = product?.id
  const [lastProductId, setLastProductId] = useState(productId)
  if (productId !== lastProductId) {
    setLastProductId(productId)
    setCommission(initialCommission ?? 10)
    setHasInteracted(false)
  }

  // Compute derived values
  const max = product?.recommenderMaxCommission || product?.maxCommission || 40
  const basePrice = product?.basePrice || 0
  const finalPrice = basePrice * (1 + commission / 100)
  const commissionAmount = basePrice * commission / 100
  const ratio = max > 0 ? commission / max : 0

  const presets = useMemo(() => {
    const steps = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max]
    return steps.filter((v, i, arr) => arr.indexOf(v) === i)
  }, [max])

  if (!product) return null

  const zone = ratio < 0.33
    ? { label: 'Éco', emoji: '🌱', color: 'text-emerald-400', gradient: 'from-emerald-400 to-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' }
    : ratio < 0.66
      ? { label: 'Standard', emoji: '⭐', color: 'text-amber-400', gradient: 'from-emerald-400 via-amber-400 to-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-amber-500/20' }
      : { label: 'Premium', emoji: '👑', color: 'text-orange-400', gradient: 'from-amber-400 via-orange-400 to-red-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', glow: 'shadow-orange-500/20' }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="commission-backdrop"
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        />
      )}

      {open && (
        <motion.div
          key="commission-modal"
          className="fixed inset-x-0 bottom-0 z-[101] flex items-end justify-center sm:inset-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#120824]/98 border border-white/10 shadow-2xl"
            initial={{ y: '100%', scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Close button */}
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white/80 transition-all z-10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>

            <div className="px-4 pb-4 pt-1 space-y-3 sm:space-y-4">
              {/* ── Product Header ── */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-purple-500/10 border border-white/10 shrink-0 relative">
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-orange-400/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="text-base font-bold text-white leading-snug line-clamp-1">{product.name}</h3>
                  <p className="text-xs text-white/40 mt-0.5">Prix de base : <span className="font-semibold text-white/60">{formatPrice(basePrice)}</span></p>
                </div>
              </motion.div>

              {/* ── Commission Zone Badge ── */}
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              >
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${zone.bg} ${zone.border} border ${zone.glow} shadow-sm`}>
                  <span className="text-sm">{zone.emoji}</span>
                  <span className={`text-xs font-bold ${zone.color}`}>Zone {zone.label}</span>
                  <span className="text-white/20">|</span>
                  <span className="text-xs text-white/50">Votre commission</span>
                </div>
              </motion.div>

              {/* ── Big Commission Display ── */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-baseline justify-center gap-1">
                  <motion.span
                    key={commission}
                    className={`text-5xl font-black bg-gradient-to-r ${zone.gradient} bg-clip-text`}
                    style={{ WebkitTextFillColor: 'transparent' }}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    {commission}
                  </motion.span>
                  <span className="text-xl font-bold text-white/30">%</span>
                </div>
                <p className="text-xs text-white/40 mt-0.5">
                  Soit <span className={`font-bold ${zone.color}`}>{formatPrice(commissionAmount)}</span> par vente
                </p>
              </motion.div>

              {/* ── Slider ── */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="relative h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-[33%] bg-emerald-500/[0.1] rounded-l-full" />
                  <div className="absolute inset-y-0 left-[33%] w-[33%] bg-amber-500/[0.1]" />
                  <div className="absolute inset-y-0 left-[66%] w-[34%] bg-orange-500/[0.1] rounded-r-full" />
                  <div className="absolute inset-0 flex items-center text-[7px] font-bold uppercase tracking-wider">
                    <span className="flex-1 text-center text-emerald-400/50">Éco</span>
                    <span className="flex-1 text-center text-amber-400/50">Standard</span>
                    <span className="flex-1 text-center text-orange-400/50">Premium</span>
                  </div>
                  <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${zone.gradient} opacity-70`}
                    style={{ width: `${(commission / max) * 100}%` }}
                    transition={{ duration: 0.15 }}
                  />
                </div>

                <div className="relative -mt-1.5">
                  <Slider
                    value={[commission]}
                    min={0}
                    max={max}
                    step={1}
                    onValueChange={(v) => {
                      setCommission(v[0])
                      setHasInteracted(true)
                    }}
                    className="w-full
                      [&_[data-slot=slider-track]]:h-4 [&_[data-slot=slider-track]]:bg-transparent [&_[data-slot=slider-track]]:rounded-full
                      [&_[data-slot=slider-range]]:bg-transparent
                      [&_[data-slot=slider-thumb]]:w-7 [&_[data-slot=slider-thumb]]:h-7 [&_[data-slot=slider-thumb]]:border-2
                      [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-md [&_[data-slot=slider-thumb]]:shadow-orange-500/30
                      [&_[data-slot=slider-thumb]]:border-orange-400 [&_[data-slot=slider-thumb]]:cursor-grab
                      [&_[data-slot=slider-thumb]]:active:cursor-grabbing [&_[data-slot=slider-thumb]]:active:scale-110"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[9px] text-white/30 shrink-0">Choix rapide</span>
                  <div className="flex items-center gap-1.5 flex-1">
                    {presets.map((p) => (
                      <motion.button
                        key={p}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          setCommission(p)
                          setHasInteracted(true)
                        }}
                        className={`flex-1 min-w-0 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          commission === p
                            ? `bg-gradient-to-r ${zone.gradient} text-white shadow-md ${zone.glow}`
                            : 'bg-white/[0.05] text-white/40 hover:bg-white/[0.1] hover:text-white/60 border border-white/[0.08]'
                        }`}
                      >
                        {p}%
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* ── Price Breakdown Cards ── */}
              <motion.div
                className="grid grid-cols-3 gap-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <div className="px-2 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
                  <p className="text-[9px] text-white/40 leading-none mb-1">💰 Prix base</p>
                  <p className="text-xs font-bold text-white/70">{formatPrice(basePrice)}</p>
                </div>
                <div className={`px-2 py-2 rounded-xl ${zone.bg} ${zone.border} border text-center`}>
                  <p className="text-[9px] text-white/40 leading-none mb-1">🎯 Ma comm.</p>
                  <p className={`text-xs font-bold ${zone.color}`}>{formatPrice(commissionAmount)}</p>
                </div>
                <div className={`px-2 py-2 rounded-xl bg-gradient-to-br ${zone.gradient} border ${zone.border} text-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/5" />
                  <p className="text-[9px] text-white/60 leading-none mb-1 relative">🛒 Prix client</p>
                  <p className="text-xs font-black text-white relative">
                    <AnimatedPrice value={finalPrice} />
                  </p>
                </div>
              </motion.div>

              {/* ── Earnings Highlight ── */}
              <motion.div
                className={`relative p-3 rounded-2xl ${zone.bg} ${zone.border} border overflow-hidden`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/50 mb-0.5">Vous gagnez par vente</p>
                    <p className="text-xl font-black text-emerald-400 leading-none">
                      <AnimatedPrice value={commissionAmount} />
                    </p>
                    <p className="text-[9px] text-white/30 mt-1">+ 5 FCFA par clic sur votre lien</p>
                  </div>
                </div>
              </motion.div>

              {/* ── CTA Button ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    onClick={() => {
                      if (product.miniSite) {
                        onShare(product.id, product.miniSite.id, commission)
                      }
                    }}
                    disabled={isSaving || !product.miniSite}
                    className="w-full h-12 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white text-sm font-bold shadow-lg shadow-orange-500/30 relative overflow-hidden rounded-xl"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400"
                      animate={{ opacity: [0, 0.3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ filter: 'blur(20px)' }}
                    />
                    <span className="relative flex items-center justify-center gap-2">
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                      Partager & Gagner
                      <span className="text-[10px] opacity-60 ml-1">{formatPrice(commissionAmount)}/vente</span>
                    </span>
                  </Button>
                </motion.div>

                <p className="text-center text-[10px] text-white/25 mt-2">
                  Définissez votre commission, puis partagez votre lien unique
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
