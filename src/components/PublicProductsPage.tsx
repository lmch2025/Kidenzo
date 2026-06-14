'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion'
import {
  Sparkles,
  Package,
  Zap,
  LogIn,
  Search,
  Star,
  ShoppingCart,
  Shield,
  Truck,
  Users,
  Eye,
  Share2,
  MessageSquare,
  Copy,
  Check,
  TrendingUp,
  Coins,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  User,
  Send,
  Loader2,
  AlertCircle,
  ExternalLink,
  X,
  LayoutDashboard,
  Image as ImageIcon,
  Download,
  RefreshCw,
  Wand2,
} from 'lucide-react'
import { useAppStore, formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import AuthScreen from '@/components/AuthScreen'

const CATEGORIES = [
  { value: 'all', label: 'Tous' },
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'textile', label: 'Textile' },
  { value: 'boisson', label: 'Boisson' },
  { value: 'electronique', label: 'Électronique' },
  { value: 'beaute', label: 'Beauté' },
  { value: 'autre', label: 'Autre' },
]

const categoryColors: Record<string, string> = {
  alimentation: 'bg-green-500/20 text-green-400 border-green-500/30',
  textile: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  boisson: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  electronique: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  beaute: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  autre: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

// Seeded random for SSR
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// Floating Particle - client-only to avoid hydration mismatch
function FloatingParticle({ index }: { index: number }) {
  const config = useMemo(() => ({
    left: `${seededRandom(index * 7 + 1) * 100}%`,
    size: `${2 + seededRandom(index * 7 + 2) * 3}px`,
    duration: 12 + seededRandom(index * 7 + 3) * 20,
    delay: seededRandom(index * 7 + 4) * 10,
    drift: -20 + seededRandom(index * 7 + 5) * 40,
    opacity: 0.15 + seededRandom(index * 7 + 6) * 0.35,
    yDistance: -(800 + seededRandom(index * 7 + 7) * 600),
  }), [index])

  const bgColor = index % 3 === 0 ? '#f97316' : index % 3 === 1 ? '#ec4899' : '#a855f7'

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: config.left,
        bottom: '-5%',
        width: config.size,
        height: config.size,
        backgroundColor: bgColor,
      }}
      animate={{
        y: [0, config.yDistance],
        x: [0, config.drift, config.drift * -0.5, config.drift * 0.3],
        opacity: [0, config.opacity, config.opacity, 0],
        scale: [0.5, 1, 1, 0.5],
      }}
      transition={{
        duration: config.duration,
        delay: config.delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  )
}

// Animated price with spring
function AnimatedPrice({ value }: { value: number }) {
  const spring = useSpring(useMotionValue(value), { stiffness: 300, damping: 30 })
  const display = useTransform(spring, (latest) => formatPrice(Math.round(latest)))

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}

// ─── Commission Popup — Elegant modal for non-digital audience ────
function CommissionPopup({
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

  // Reset commission when product changes — using a key-derived approach
  const productId = product?.id
  const [lastProductId, setLastProductId] = useState(productId)
  if (productId !== lastProductId) {
    setLastProductId(productId)
    setCommission(initialCommission ?? 10)
    setHasInteracted(false)
  }

  // Compute derived values before any early return
  const max = product?.maxCommission || 40
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

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Popup Container */}
          <motion.div
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

              <div className="px-5 pb-6 pt-2 space-y-5">
                {/* ── Product Header ── */}
                <motion.div
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-purple-500/10 border border-white/10 shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-7 h-7 text-orange-400/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className="text-lg font-bold text-white leading-snug line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-white/40 mt-0.5">Prix de base : <span className="font-semibold text-white/60">{formatPrice(basePrice)}</span></p>
                  </div>
                </motion.div>

                {/* ── Commission Zone Badge ── */}
                <motion.div
                  className="flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                >
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl ${zone.bg} ${zone.border} border ${zone.glow} shadow-lg`}>
                    <span className="text-lg">{zone.emoji}</span>
                    <span className={`text-sm font-bold ${zone.color}`}>Zone {zone.label}</span>
                    <span className="text-white/20">|</span>
                    <span className="text-sm text-white/50">Votre commission</span>
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
                      className={`text-6xl font-black bg-gradient-to-r ${zone.gradient} bg-clip-text`}
                      style={{ WebkitTextFillColor: 'transparent' }}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      {commission}
                    </motion.span>
                    <span className="text-2xl font-bold text-white/30">%</span>
                  </div>
                  <p className="text-sm text-white/40 mt-1">
                    Soit <span className={`font-bold ${zone.color}`}>{formatPrice(commissionAmount)}</span> par vente
                  </p>
                </motion.div>

                {/* ── Slider ── */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Zone indicator bar */}
                  <div className="relative h-4 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-[33%] bg-emerald-500/[0.1] rounded-l-full" />
                    <div className="absolute inset-y-0 left-[33%] w-[33%] bg-amber-500/[0.1]" />
                    <div className="absolute inset-y-0 left-[66%] w-[34%] bg-orange-500/[0.1] rounded-r-full" />
                    {/* Zone labels */}
                    <div className="absolute inset-0 flex items-center text-[8px] font-bold uppercase tracking-wider">
                      <span className="flex-1 text-center text-emerald-400/50">Éco</span>
                      <span className="flex-1 text-center text-amber-400/50">Standard</span>
                      <span className="flex-1 text-center text-orange-400/50">Premium</span>
                    </div>
                    {/* Filled portion */}
                    <motion.div
                      className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${zone.gradient} opacity-70`}
                      style={{ width: `${(commission / max) * 100}%` }}
                      transition={{ duration: 0.15 }}
                    />
                  </div>

                  {/* Slider control */}
                  <div className="relative -mt-2">
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
                        [&_[data-slot=slider-track]]:h-5 [&_[data-slot=slider-track]]:bg-transparent [&_[data-slot=slider-track]]:rounded-full
                        [&_[data-slot=slider-range]]:bg-transparent
                        [&_[data-slot=slider-thumb]]:w-8 [&_[data-slot=slider-thumb]]:h-8 [&_[data-slot=slider-thumb]]:border-3
                        [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-xl [&_[data-slot=slider-thumb]]:shadow-orange-500/30
                        [&_[data-slot=slider-thumb]]:border-orange-400 [&_[data-slot=slider-thumb]]:cursor-grab
                        [&_[data-slot=slider-thumb]]:active:cursor-grabbing [&_[data-slot=slider-thumb]]:active:scale-110"
                    />
                  </div>

                  {/* Presets — Large touch-friendly buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-white/30 shrink-0">Choix rapide</span>
                    <div className="flex items-center gap-2 flex-1">
                      {presets.map((p) => (
                        <motion.button
                          key={p}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => {
                            setCommission(p)
                            setHasInteracted(true)
                          }}
                          className={`flex-1 min-w-0 py-2 rounded-xl text-xs font-bold transition-all ${
                            commission === p
                              ? `bg-gradient-to-r ${zone.gradient} text-white shadow-lg ${zone.glow}`
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
                  className="grid grid-cols-3 gap-3"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  {/* Base Price */}
                  <div className="px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
                    <p className="text-[10px] text-white/40 leading-none mb-1.5">💰 Prix de base</p>
                    <p className="text-sm font-bold text-white/70">{formatPrice(basePrice)}</p>
                  </div>
                  {/* Commission */}
                  <div className={`px-3 py-3 rounded-xl ${zone.bg} ${zone.border} border text-center`}>
                    <p className="text-[10px] text-white/40 leading-none mb-1.5">🎯 Ma commission</p>
                    <p className={`text-sm font-bold ${zone.color}`}>{formatPrice(commissionAmount)}</p>
                  </div>
                  {/* Customer Price */}
                  <div className={`px-3 py-3 rounded-xl bg-gradient-to-br ${zone.gradient} border ${zone.border} text-center relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-white/5" />
                    <p className="text-[10px] text-white/60 leading-none mb-1.5 relative">🛒 Prix client</p>
                    <p className="text-sm font-black text-white relative">
                      <AnimatedPrice value={finalPrice} />
                    </p>
                  </div>
                </motion.div>

                {/* ── Earnings Highlight ── */}
                <motion.div
                  className={`relative p-4 rounded-2xl ${zone.bg} ${zone.border} border overflow-hidden`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/50 mb-0.5">Vous gagnez par vente</p>
                      <p className="text-2xl font-black text-emerald-400">
                        <AnimatedPrice value={commissionAmount} />
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">+ 5 FCFA par clic sur votre lien</p>
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
                      className="w-full h-14 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white text-base font-bold shadow-xl shadow-orange-500/30 relative overflow-hidden rounded-2xl"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400"
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ filter: 'blur(20px)' }}
                      />
                      <span className="relative flex items-center justify-center gap-2.5">
                        {isSaving ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Share2 className="w-5 h-5" />
                        )}
                        Partager & Gagner
                        <span className="text-xs opacity-60 ml-1">{formatPrice(commissionAmount)}/vente</span>
                      </span>
                    </Button>
                  </motion.div>

                  {/* Subtle hint text */}
                  <p className="text-center text-[10px] text-white/25 mt-2">
                    Définissez votre commission, puis partagez votre lien unique
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Marketing Share Modal ────────────────────────────────────────
function MarketingShareModal({
  open,
  onClose,
  product,
  commissionPct,
  shareLink,
}: {
  open: boolean
  onClose: () => void
  product: { name: string; basePrice: number; imageUrl?: string; description?: string; category?: string } | null
  commissionPct: number
  shareLink: string
}) {
  const [copied, setCopied] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [nativeShareSupported] = useState(() => {
    if (typeof navigator === 'undefined') return false
    return !!navigator.share
  })

  const [aiText, setAiText] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiModel, setAiModel] = useState<string | null>(null)

  // Generate AI marketing text when modal opens
  const generateAiText = useCallback(async () => {
    setAiLoading(true)
    setAiText(null)
    try {
      const res = await fetch('/api/generate-marketing-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product?.name,
          basePrice: product?.basePrice,
          commissionPct,
          description: product?.description,
          category: product?.category,
          shareLink,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.text) {
          setAiText(data.text)
          setAiModel(data.model || null)
        }
      }
    } catch (err) {
      console.error('Failed to generate AI text:', err)
    } finally {
      setAiLoading(false)
    }
  }, [product, commissionPct, shareLink])

  // Auto-generate when modal opens
  useEffect(() => {
    if (open && product?.name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      generateAiText()
    }
    if (!open) {
      setAiText(null)
      setAiModel(null)
    }
  }, [open, product?.name, generateAiText])

  const finalPrice = product ? product.basePrice * (1 + commissionPct / 100) : 0

  const marketingMessages = useMemo(() => {
    if (!product) return []
    const imageNote = product.imageUrl ? ' 📸 Voir l\'image dans le lien' : ''
    return [
      {
        label: '🔥 Offre flash',
        message: `🔥 OFFRE EXCLUSIVE ! ${product.name} à seulement ${formatPrice(finalPrice)} ! Commandez maintenant, stock limité !${imageNote} 👉 ${shareLink}`,
      },
      {
        label: '💯 Recommandation',
        message: `💯 J'ai trouvé ce produit incroyable : ${product.name} à ${formatPrice(finalPrice)}. Qualité garantie !${imageNote} 👉 ${shareLink}`,
      },
      {
        label: '⏰ Urgence',
        message: `⏰ Dernière chance ! ${product.name} à ${formatPrice(finalPrice)}. Ne ratez pas cette offre !${imageNote} 👉 ${shareLink}`,
      },
      {
        label: '🎁 Cadeau',
        message: `🎁 Offrez-vous ${product.name} ! Seulement ${formatPrice(finalPrice)}. Livraison rapide !${imageNote} 👉 ${shareLink}`,
      },
    ]
  }, [product, finalPrice, shareLink])

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const shareToWhatsApp = (message: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank')
  }

  const shareToTwitter = () => {
    if (!product) return
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Découvrez ${product.name} à ${formatPrice(finalPrice)} !`)}&url=${encodeURIComponent(shareLink)}`, '_blank')
  }

  // Native share with image file attached
  const shareWithImage = async () => {
    if (!product?.imageUrl) return
    setImageLoading(true)
    try {
      // Fetch image through proxy to avoid CORS issues
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(product.imageUrl)}`
      const res = await fetch(proxyUrl)
      if (!res.ok) throw new Error('Failed to fetch image')

      const blob = await res.blob()
      // Determine file extension from content type
      const contentType = res.headers.get('Content-Type') || 'image/png'
      const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : contentType.includes('webp') ? 'webp' : 'png'
      const fileName = `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`
      const imageFile = new File([blob], fileName, { type: contentType })

      const shareData = {
        title: product.name,
        text: `Découvrez ${product.name} à ${formatPrice(finalPrice)} ! Commandez maintenant 👉`,
        url: shareLink,
        files: [imageFile],
      }

      // Check if sharing files is supported
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: share without image
        await navigator.share({
          title: product.name,
          text: `Découvrez ${product.name} à ${formatPrice(finalPrice)} ! 📸 Voir l'image dans le lien`,
          url: shareLink,
        })
      }
    } catch (err) {
      // User cancelled or share failed — fallback to simple share
      if (err instanceof Error && err.name !== 'AbortError') {
        try {
          await navigator.share({
            title: product.name,
            text: `Découvrez ${product.name} à ${formatPrice(finalPrice)} !`,
            url: shareLink,
          })
        } catch {
          // User cancelled
        }
      }
    } finally {
      setImageLoading(false)
    }
  }

  if (!product) return null

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="bg-[#0d0118]/98 backdrop-blur-2xl border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-white text-xl flex items-center gap-2">
            <Share2 className="w-5 h-5 text-orange-400" />
            Outils Marketing
          </SheetTitle>
          <SheetDescription className="text-white/50">
            Partagez <strong className="text-white/70">{product.name}</strong> et gagnez {formatPrice(product.basePrice * commissionPct / 100)} par vente + 5 FCFA/clic
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pt-4">
          {/* ── AI-Generated Marketing Text (HERO SECTION) ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden border border-orange-500/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-pink-500/5 to-purple-500/5" />
            <div className="relative p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                    <Wand2 className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-orange-400/80 uppercase tracking-wider">Texte IA</span>
                    {aiModel && aiModel !== 'fallback' && (
                      <span className="text-[9px] text-white/20 ml-1.5">({aiModel.split('/')[1]?.split(':')[0]})</span>
                    )}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={generateAiText}
                  disabled={aiLoading}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-orange-400 transition-colors disabled:opacity-30"
                  title="Regénérer un nouveau texte"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                </motion.button>
              </div>

              {aiLoading ? (
                <div className="space-y-2.5">
                  <div className="h-4 rounded-full bg-white/[0.06] animate-pulse w-full" />
                  <div className="h-4 rounded-full bg-white/[0.04] animate-pulse w-4/5" />
                  <div className="flex items-center gap-2 mt-2">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/10"
                    >
                      <Sparkles className="w-3 h-3 text-orange-400" />
                      <span className="text-[10px] text-orange-400/70 font-medium">Rédaction en cours...</span>
                    </motion.div>
                  </div>
                </div>
              ) : aiText ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-sm text-white/80 leading-relaxed font-medium italic">
                    &ldquo;{aiText}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyToClipboard(`${aiText} 👉 ${shareLink}`, 'ai')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/20 hover:border-orange-500/40 transition-colors"
                    >
                      {copied === 'ai' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-orange-400" />
                      )}
                      <span className="text-[10px] font-semibold text-orange-400/80">
                        {copied === 'ai' ? 'Copié !' : 'Copier'}
                      </span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => shareToWhatsApp(`${aiText} 👉 ${shareLink}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 hover:border-emerald-500/30 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-semibold text-emerald-400/80">WhatsApp</span>
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <p className="text-[11px] text-white/30 italic">Cliquez sur ↻ pour générer un texte</p>
              )}
            </div>
          </motion.div>

          {/* Product Image Preview */}
          {product.imageUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-2xl overflow-hidden border border-white/10"
            >
              <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-orange-500/5 via-pink-500/5 to-purple-500/5">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{product.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">Prix client : {formatPrice(finalPrice)}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ImageIcon className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400/70">Image jointe au partage</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Share with image button (native Web Share API) */}
          {product.imageUrl && nativeShareSupported && (
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                onClick={shareWithImage}
                disabled={imageLoading}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
                  animate={imageLoading ? {} : { opacity: [0, 0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ filter: 'blur(15px)' }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  {imageLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {imageLoading ? 'Chargement de l\'image...' : 'Partager avec l\'image'}
                </span>
              </Button>
            </motion.div>
          )}

          {/* Share link */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Votre lien de recommandation</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/50 text-xs truncate font-mono">
                {shareLink}
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(shareLink, 'link')}
                  className="h-10 px-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-semibold"
                >
                  {copied === 'link' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Social sharing */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Partager sur les réseaux</Label>
            <div className="grid grid-cols-3 gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => shareToWhatsApp(marketingMessages[0].message)}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={shareToFacebook}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-blue-600/20 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-600/30 transition-colors"
              >
                <Users className="w-4 h-4" />
                Facebook
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={shareToTwitter}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-sky-600/20 border border-sky-500/20 text-sky-400 text-xs font-semibold hover:bg-sky-600/30 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Twitter
              </motion.button>
            </div>
          </div>

          {/* Marketing messages */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Messages marketing prêts à copier</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {marketingMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-orange-500/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-orange-400/70">{msg.label}</span>
                      <p className="text-[11px] text-white/50 leading-relaxed mt-0.5 line-clamp-3">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyToClipboard(msg.message, `msg-${i}`)}
                        className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
                      >
                        {copied === `msg-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => shareToWhatsApp(msg.message)}
                        className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400/50 hover:text-emerald-400 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* QR Code placeholder */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center space-y-2">
            <div className="w-24 h-24 mx-auto rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="grid grid-cols-5 gap-0.5 w-16 h-16">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${seededRandom(i + 42) > 0.4 ? 'bg-white/20' : 'bg-transparent'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-white/30">QR Code de votre lien</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(shareLink, 'qr')}
              className="border-white/10 hover:bg-white/5 text-white/50 text-xs h-8"
            >
              {copied === 'qr' ? <Check className="w-3 h-3 mr-1 text-emerald-400" /> : <Copy className="w-3 h-3 mr-1" />}
              Copier le lien
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Direct Order Sheet (no commission) ──────────────────────────
function DirectOrderSheet({
  open,
  onClose,
  product,
}: {
  open: boolean
  onClose: () => void
  product: { id: string; name: string; basePrice: number; description: string; owner?: { name: string | null; phone: string } } | null
}) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerMessage, setCustomerMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!customerName || !customerPhone || !customerAddress || !product) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)

    try {
      // First ensure mini-site exists
      let miniSiteId: string | null = null
      const miniSiteRes = await fetch('/api/mini-sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })
      const miniSiteData = await miniSiteRes.json()

      if (miniSiteRes.ok || miniSiteRes.status === 409) {
        miniSiteId = miniSiteData.miniSite?.id || miniSiteData.id
      }

      if (!miniSiteId) {
        setError('Erreur lors de la préparation de la commande')
        setLoading(false)
        return
      }

      // Create order with NO recommender (direct order, no commission)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          miniSiteId,
          customerName,
          customerPhone,
          customerAddress,
          customerMessage: customerMessage || null,
          finalPrice: product.basePrice, // Base price, no commission
          // No recommenderId → no commission
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la commande')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('Erreur réseau. Réessayez.')
      setLoading(false)
    }
  }, [product, customerName, customerPhone, customerAddress, customerMessage])

  const handleWhatsApp = () => {
    if (!product) return
    const ownerPhone = product.owner?.phone?.replace(/^0/, '237').replace(/\s/g, '') || '237'
    const msg = encodeURIComponent(
      `Bonjour ! Je souhaite commander : ${product.name} à ${formatPrice(product.basePrice)}.\n\nMon nom : ${customerName || '[à remplir]'}\nMon téléphone : ${customerPhone || '[à remplir]'}\nAdresse : ${customerAddress || '[à remplir]'}`
    )
    window.open(`https://wa.me/${ownerPhone}?text=${msg}`, '_blank')
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setSuccess(false)
      setError('')
      setCustomerName('')
      setCustomerPhone('')
      setCustomerAddress('')
      setCustomerMessage('')
    }
  }

  if (!product) return null

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <SheetContent side="bottom" className="bg-[#0d0118]/98 backdrop-blur-2xl border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-white text-xl flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-400" />
            {success ? 'Commande envoyée !' : 'Commander directement'}
          </SheetTitle>
          <SheetDescription className="text-white/50">
            {success
              ? 'Votre commande a été envoyée avec succès'
              : `Commandez ${product.name} au prix de base — sans commission`}
          </SheetDescription>
        </SheetHeader>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8 space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
              >
                <Check className="w-10 h-10 text-emerald-400" />
              </motion.div>
              <p className="text-white text-lg font-semibold">Commande envoyée !</p>
              <p className="text-white/50 text-sm text-center max-w-xs">
                Vous recevrez une confirmation par téléphone très prochainement. Merci !
              </p>
              <div className="flex gap-3">
                <Button onClick={handleWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <MessageSquare className="w-4 h-4 mr-2" /> Suivre sur WhatsApp
                </Button>
                <Button onClick={handleClose} variant="outline" className="border-white/20 text-white/60">
                  Fermer
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4 pt-2"
            >
              {/* Price summary - No commission */}
              <div className="bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 rounded-xl p-4 border border-orange-500/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                      <Package className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">{product.name}</p>
                      <p className="text-white/30 text-[10px] flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Prix direct · Aucune commission
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-black gradient-text-warm">{formatPrice(product.basePrice)}</p>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-3">
                <div>
                  <Label className="text-white/60 text-xs mb-1.5 block">Nom complet *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Votre nom"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-orange-400/50 h-10"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white/60 text-xs mb-1.5 block">Téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="6XX XXX XXX"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-orange-400/50 h-10"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white/60 text-xs mb-1.5 block">Adresse de livraison *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-white/20" />
                    <Textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Votre adresse complète"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-orange-400/50 min-h-[60px] resize-none"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white/60 text-xs mb-1.5 block">Message (optionnel)</Label>
                  <Textarea
                    value={customerMessage}
                    onChange={(e) => setCustomerMessage(e.target.value)}
                    placeholder="Instructions spéciales..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-orange-400/50 min-h-[50px] resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-bold text-sm shadow-xl shadow-orange-500/30 relative overflow-hidden disabled:opacity-60"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400"
                  animate={{ opacity: [0, 0.4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ filter: 'blur(20px)' }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                  Commander {formatPrice(product.basePrice)}
                </span>
              </motion.button>

              {/* WhatsApp alternative */}
              <motion.button
                type="button"
                onClick={handleWhatsApp}
                className="w-full h-11 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <MessageSquare className="w-4 h-4" />
                Commander via WhatsApp
              </motion.button>

              <p className="text-white/20 text-[10px] text-center flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Commande sécurisée · Aucune commission incluse
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function PublicProductsPage() {
  const {
    publicProducts,
    setPublicProducts,
    setShowAuthModal,
    showAuthModal,
    authModalReason,
    isAuthenticated,
    user,
    token,
    setCurrentView,
    pendingAction,
    setPendingAction,
    clearPendingAction,
  } = useAppStore()

  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  // Commission popup state
  const [commissionPopupOpen, setCommissionPopupOpen] = useState(false)
  const [commissionPopupProduct, setCommissionPopupProduct] = useState<{
    id: string; name: string; basePrice: number; maxCommission: number;
    description?: string; imageUrl?: string;
    miniSite?: { id: string; slug: string } | null;
  } | null>(null)
  const [savingCommission, setSavingCommission] = useState<string | null>(null)
  // Track the commission value the recommender chose (for restoration after auth)
  const [pendingCommission, setPendingCommission] = useState<number | null>(null)

  // Marketing share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareModalProduct, setShareModalProduct] = useState<{
    name: string; basePrice: number; imageUrl?: string; description?: string; category?: string;
  } | null>(null)
  const [shareModalLink, setShareModalLink] = useState('')
  const [shareModalCommission, setShareModalCommission] = useState(0)

  // Direct order sheet state
  const [orderProduct, setOrderProduct] = useState<{
    id: string; name: string; basePrice: number; description: string;
    owner?: { name: string | null; phone: string };
  } | null>(null)
  const [orderSheetOpen, setOrderSheetOpen] = useState(false)

  // Fetch public products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/products?status=active')
        if (res.ok) {
          const data = await res.json()
          setPublicProducts(data.products || data || [])
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [setPublicProducts])

  // Ensure all products have mini-sites
  useEffect(() => {
    const ensureMiniSites = async () => {
      const productsWithoutMiniSite = publicProducts.filter(p => p.status === 'active' && !p.miniSite)
      for (const product of productsWithoutMiniSite) {
        try {
          const res = await fetch('/api/mini-sites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id }),
          })
          const data = await res.json()
          if (res.ok || res.status === 409) {
            const miniSite = data.miniSite || data
            setPublicProducts(
              publicProducts.map(p =>
                p.id === product.id ? { ...p, miniSite } : p
              )
            )
          }
        } catch {
          // Silently continue
        }
      }
    }
    if (publicProducts.length > 0 && !isLoading) {
      ensureMiniSites()
    }
  }, [isLoading, publicProducts, setPublicProducts])

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = publicProducts.filter(p => p.status === 'active')

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [publicProducts, selectedCategory, searchQuery])

  // Handle "Recommander & Gagner" click → toggle inline slider
  const handleRecommendClick = (product: typeof publicProducts[0]) => {
    setCommissionPopupProduct({
      id: product.id,
      name: product.name,
      basePrice: product.basePrice,
      maxCommission: product.maxCommission,
      description: product.description,
      imageUrl: product.images && product.images.length > 0 ? product.images[0].storageUrl : undefined,
      miniSite: product.miniSite,
    })
    setCommissionPopupOpen(true)
  }

  // ── Auto-resume pending action after authentication ──
  useEffect(() => {
    if (!isAuthenticated || !user || !pendingAction) return

    const resumeAction = async () => {
      const { productId, miniSiteId, commissionPct } = pendingAction

      // Clear pending action first to prevent double-execution
      clearPendingAction()

      // Open the commission popup with the pending commission
      const product = publicProducts.find(p => p.id === productId)
      if (product) {
        setCommissionPopupProduct({
          id: product.id,
          name: product.name,
          basePrice: product.basePrice,
          maxCommission: product.maxCommission,
          description: product.description,
          imageUrl: product.images && product.images.length > 0 ? product.images[0].storageUrl : undefined,
          miniSite: product.miniSite,
        })
        setPendingCommission(commissionPct)
        setCommissionPopupOpen(true)
      }

      // Save commission and open marketing tools
      setSavingCommission(productId)
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        await fetch('/api/recommender', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            userId: user.id,
            miniSiteId,
            commissionPct,
          }),
        })

        // Build share link
        const slug = product?.miniSite?.slug
        if (slug) {
          const link = `${window.location.origin}/s/${slug}?ref=${user.id}`
          setShareModalProduct({
            name: product!.name,
            basePrice: product!.basePrice,
            imageUrl: product!.images && product!.images.length > 0 ? product!.images[0].storageUrl : undefined,
            description: product!.description,
            category: product!.category,
          })
          setShareModalLink(link)
          setShareModalCommission(commissionPct)
          // Close commission popup and open marketing tools
          setCommissionPopupOpen(false)
          setShareModalOpen(true)
          setPendingCommission(null)
        }
      } catch (error) {
        console.error('Failed to resume action:', error)
      } finally {
        setSavingCommission(null)
      }
    }

    // Small delay to allow UI to settle after auth
    const timer = setTimeout(resumeAction, 300)
    return () => clearTimeout(timer)
  }, [isAuthenticated, user, pendingAction, token, publicProducts, clearPendingAction])

  // Handle share from commission popup → save commission + show marketing tools
  const handleShareFromPopup = async (productId: string, miniSiteId: string, commissionPct: number) => {
    // If not authenticated, save the pending action and show auth modal
    if (!isAuthenticated) {
      // Persist the action context so we can resume after auth
      setPendingAction({
        productId,
        miniSiteId,
        commissionPct,
        timestamp: Date.now(),
      })
      // Close popup and show auth
      setCommissionPopupOpen(false)
      setShowAuthModal(true, 'Connectez-vous pour partager votre lien de recommandation et commencer à gagner')
      return
    }

    setSavingCommission(productId)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      // Save commission
      await fetch('/api/recommender', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user?.id,
          miniSiteId,
          commissionPct,
        }),
      })

      // Build share link
      const product = publicProducts.find(p => p.id === productId)
      const slug = product?.miniSite?.slug
      if (slug && user) {
        const link = `${window.location.origin}/s/${slug}?ref=${user.id}`
        setShareModalProduct({
          name: product.name,
          basePrice: product.basePrice,
          imageUrl: product.images && product.images.length > 0 ? product.images[0].storageUrl : undefined,
          description: product.description,
          category: product.category,
        })
        setShareModalLink(link)
        setShareModalCommission(commissionPct)
        // Close commission popup and open marketing tools
        setCommissionPopupOpen(false)
        setShareModalOpen(true)
        setPendingCommission(null)
      }
    } catch (error) {
      console.error('Failed to save commission:', error)
    } finally {
      setSavingCommission(null)
    }
  }

  // Handle "Commander" click → direct order at base price
  const handleOrderClick = (product: typeof publicProducts[0]) => {
    setOrderProduct({
      id: product.id,
      name: product.name,
      basePrice: product.basePrice,
      description: product.description,
    })
    setOrderSheetOpen(true)
  }

  // Copy link
  const handleCopyLink = async (slug: string) => {
    const link = `${window.location.origin}/s/${slug}`
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    setCopySuccess(slug)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <div className="flex flex-col relative">
      {/* ── Background Effects ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="aurora-blob absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, oklch(0.72 0.22 30 / 40%), transparent 70%)' }}
        />
        <div
          className="aurora-blob-slow absolute top-1/3 -right-48 w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, oklch(0.65 0.2 320 / 35%), transparent 70%)' }}
        />
        <div
          className="aurora-blob absolute -bottom-32 left-1/3 w-[450px] h-[450px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, oklch(0.7 0.18 160 / 30%), transparent 70%)', animationDelay: '-5s' }}
        />
        {Array.from({ length: 20 }).map((_, i) => (
          <FloatingParticle key={i} index={i} />
        ))}
      </div>

      {/* ── Hero Section ── */}
      <section className="relative z-10 pt-8 pb-8 w-full mt-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center space-y-5"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-medium text-orange-300">Commandez ou Recommandez & Gagnez</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
            Découvrez des produits
            <br />
            <span className="animated-gradient-text">exceptionnels</span>
          </h1>

          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
            Achetez directement au meilleur prix ou recommandez et gagnez des commissions sur chaque vente et chaque clic.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 pt-2">
            {[
              { value: publicProducts.length.toString(), label: 'Produits', icon: Package },
              { value: '5 FCFA', label: 'Par clic', icon: Zap },
              { value: '0%', label: 'Commission directe', icon: ShoppingCart },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex flex-col items-center gap-1"
              >
                <stat.icon className="w-4 h-4 text-orange-400/60" />
                <span className="text-xl font-bold gradient-text">{stat.value}</span>
                <span className="text-[11px] text-white/30">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Search & Filter ── */}
      <section className="relative z-10 px-4 pb-6 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-orange-400/50 h-11 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Products Grid ── */}
      <main className="relative z-10 flex-1 px-4 pb-8 max-w-6xl mx-auto w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                <div className="h-44 bg-white/5" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-white/5 rounded-lg w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                  <div className="h-8 bg-white/5 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-16 text-center max-w-lg mx-auto"
          >
            <Package className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/70 mb-2">
              {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
            </h3>
            <p className="text-white/30 text-sm">
              {searchQuery
                ? 'Essayez avec d\'autres mots-clés ou catégories'
                : 'Les produits apparaîtront ici dès qu\'ils seront ajoutés par les vendeurs'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="glass-card rounded-2xl overflow-hidden group"
                >
                  {/* Product Image Area */}
                  <div className="relative h-44 bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-purple-500/10 flex items-center justify-center overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].storageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Package className="w-14 h-14 text-orange-400/20 group-hover:scale-110 transition-transform duration-500" />
                    )}

                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent pointer-events-none"
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
                    />

                    {/* Category badge */}
                    <div className="absolute top-3 left-3">
                      <Badge
                        className={`text-[10px] ${categoryColors[product.category] ?? categoryColors.autre}`}
                        variant="outline"
                      >
                        {CATEGORIES.find(c => c.value === product.category)?.label ?? product.category}
                      </Badge>
                    </div>

                    {/* Stock indicator */}
                    {product.stock > 0 && product.stock <= 20 && (
                      <div className="absolute top-3 right-3 bg-red-500/80 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-white" />
                        <span className="text-white text-[10px] font-bold">Plus que {product.stock}</span>
                      </div>
                    )}

                    {/* Direct order badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-[9px] font-medium text-white/40 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                        Prix direct : {formatPrice(product.basePrice)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-white/30 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-black gradient-text-warm">
                        {formatPrice(product.basePrice)}
                      </span>
                      {product.maxCommission > 0 && (
                        <span className="text-[10px] text-emerald-400/70 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Jusqu&apos;à {product.maxCommission}% commission
                        </span>
                      )}
                    </div>

                    {/* ── TWO MAIN BUTTONS ── */}
                    <div className="border-t border-white/5 pt-3 space-y-2.5">
                      {/* Commander - Primary CTA for customers */}
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          size="sm"
                          onClick={() => handleOrderClick(product)}
                          className="w-full h-10 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-orange-500/20 relative overflow-hidden group"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400"
                            animate={{ opacity: [0, 0.3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ filter: 'blur(15px)' }}
                          />
                          <span className="relative flex items-center justify-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Commander
                            <span className="text-[10px] opacity-60">· {formatPrice(product.basePrice)}</span>
                          </span>
                        </Button>
                      </motion.div>

                      {/* Recommander & Gagner - Opens commission popup */}
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          size="sm"
                          onClick={() => handleRecommendClick(product)}
                          className="w-full h-10 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-semibold transition-all relative overflow-hidden"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-transparent to-emerald-400/10"
                            animate={{ opacity: [0, 0.5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <span className="relative flex items-center justify-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Recommander & Gagner
                            <TrendingUp className="w-3.5 h-3.5 ml-0.5 text-emerald-400/60" />
                          </span>
                        </Button>
                      </motion.div>

                      {/* Quick copy link for mini-site */}
                      {product.miniSite && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleCopyLink(product.miniSite!.slug)}
                            className="flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/30 text-[10px] hover:bg-white/[0.06] hover:text-white/50 transition-colors"
                          >
                            {copySuccess === product.miniSite.slug ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copié !</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copier le lien
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => window.open(`/s/${product.miniSite!.slug}`, '_blank')}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/30 hover:bg-white/[0.06] hover:text-white/50 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* ── Features Section ── */}
      <section className="relative z-10 px-4 py-16 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Comment ça <span className="gradient-text-warm">fonctionne</span> ?
          </h2>
          <p className="text-white/40 text-sm max-w-lg mx-auto">
            Achetez directement ou recommandez et gagnez
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            {
              step: '01',
              icon: ShoppingCart,
              title: 'Commandez directement',
              desc: 'Achetez au prix de base sans commission. Simple et rapide.',
              gradient: 'from-orange-500/20 to-orange-500/5',
              border: 'border-orange-500/15',
              iconColor: 'text-orange-400',
            },
            {
              step: '02',
              icon: Users,
              title: 'Ou Recommandez & Gagnez',
              desc: 'Définissez votre commission, partagez votre lien et gagnez sur chaque vente + clic.',
              gradient: 'from-emerald-500/20 to-emerald-500/5',
              border: 'border-emerald-500/15',
              iconColor: 'text-emerald-400',
            },
            {
              step: '03',
              icon: MessageSquare,
              title: 'Outils marketing',
              desc: 'Messages prêts à copier, partage WhatsApp/Facebook, QR code.',
              gradient: 'from-pink-500/20 to-pink-500/5',
              border: 'border-pink-500/15',
              iconColor: 'text-pink-400',
            },
            {
              step: '04',
              icon: Zap,
              title: 'Gagnez par clic',
              desc: '5 FCFA par clic sur votre lien, même sans commande.',
              gradient: 'from-purple-500/20 to-purple-500/5',
              border: 'border-purple-500/15',
              iconColor: 'text-purple-400',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative glass-card rounded-2xl p-6 bg-gradient-to-b ${feature.gradient} ${feature.border}`}
            >
              <span className="absolute top-3 right-4 text-3xl font-black text-white/[0.03]">{feature.step}</span>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1.5">{feature.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 mt-auto border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold gradient-text-warm">Kidenzo</span>
          </div>
          <div className="flex items-center gap-4 text-white/20 text-[11px]">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Paiement sécurisé
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3" />
              Livraison garantie
            </span>
          </div>
          <p className="text-white/15 text-[11px]">
            © {new Date().getFullYear()} Kidenzo · Tous droits réservés
          </p>
        </div>
      </footer>

      {/* ── Commission Popup ── */}
      <CommissionPopup
        open={commissionPopupOpen}
        onClose={() => setCommissionPopupOpen(false)}
        product={commissionPopupProduct}
        onShare={handleShareFromPopup}
        isSaving={savingCommission === commissionPopupProduct?.id}
        initialCommission={pendingCommission}
      />

      {/* ── Direct Order Sheet ── */}
      <DirectOrderSheet
        open={orderSheetOpen}
        onClose={() => setOrderSheetOpen(false)}
        product={orderProduct}
      />

      {/* ── Marketing Share Modal ── */}
      <MarketingShareModal
        open={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false)
          // After a resumed action is completed and user closes the marketing modal,
          // navigate to dashboard if authenticated
          if (isAuthenticated && !pendingAction) {
            setCurrentView('dashboard')
          }
        }}
        product={shareModalProduct}
        commissionPct={shareModalCommission}
        shareLink={shareModalLink}
      />

      {/* ── Auth Modal ── */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setShowAuthModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative z-10 w-full max-w-md max-h-[95dvh] overflow-hidden rounded-2xl"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/20 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              {authModalReason && (
                <div className="bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 border-b border-orange-500/20 px-5 py-3 rounded-t-2xl">
                  <p className="text-white/60 text-xs text-center flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    {authModalReason}
                  </p>
                </div>
              )}
              {pendingAction && (
                <div className="bg-emerald-500/5 border-b border-emerald-500/15 px-5 py-2.5">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-emerald-400/80 text-[11px] font-medium">
                      Votre commission de {pendingAction.commissionPct}% sera automatiquement enregistrée après connexion
                    </p>
                  </div>
                </div>
              )}
              <AuthScreen />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
