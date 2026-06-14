'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import {
  Share2,
  Copy,
  Check,
  Eye,
  Package,
  SlidersHorizontal,
  Link2,
  MousePointerClick,
  ExternalLink,
  TrendingUp,
  Coins,
  Sparkles,
  ChevronRight,
  Info,
  Zap,
  MessageSquare,
  Users,
  Image as ImageIcon,
  Download,
  Loader2,
  RefreshCw,
  Wand2,
} from 'lucide-react'
import { useAppStore, formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

// ─── Animated Price Counter ──────────────────────────────────────
function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(useMotionValue(value), { stiffness: 300, damping: 30 })
  const display = useTransform(spring, (latest) => formatPrice(Math.round(latest)))

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span className={className}>{display}</motion.span>
}

// ─── Price Breakdown Bubble ──────────────────────────────────────
function PriceBubble({
  label,
  amount,
  color,
  icon: Icon,
  delay,
}: {
  label: string
  amount: number
  color: string
  icon: React.ElementType
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl ${color} border backdrop-blur-sm`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] opacity-60 leading-none mb-0.5">{label}</p>
        <p className="text-sm font-bold leading-none">{formatPrice(amount)}</p>
      </div>
    </motion.div>
  )
}

// ─── Commission Slider with Volume-Style UX ──────────────────────
function CommissionSlider({
  value,
  max,
  onChange,
  basePrice,
}: {
  value: number
  max: number
  onChange: (val: number) => void
  basePrice: number
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const finalPrice = basePrice * (1 + value / 100)
  const commissionAmount = basePrice * value / 100
  const ratio = max > 0 ? value / max : 0

  // Zone colors based on commission level
  const getZoneInfo = (val: number, maxVal: number) => {
    const r = maxVal > 0 ? val / maxVal : 0
    if (r < 0.33) return { label: 'Éco', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', gradient: 'from-emerald-400 to-emerald-500' }
    if (r < 0.66) return { label: 'Standard', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', gradient: 'from-emerald-400 via-amber-400 to-amber-500' }
    return { label: 'Premium', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', gradient: 'from-amber-400 via-orange-400 to-red-400' }
  }

  const zone = getZoneInfo(value, max)

  // Preset values
  const presets = useMemo(() => {
    const steps = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max]
    return steps.filter((v, i, arr) => arr.indexOf(v) === i)
  }, [max])

  // Tick marks
  const ticks = useMemo(() => {
    const count = 5
    return Array.from({ length: count + 1 }, (_, i) => Math.round((max / count) * i))
  }, [max])

  return (
    <div className="space-y-4">
      {/* ── Main Price Display ── */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Background gradient that changes with commission level */}
        <div className={`absolute inset-0 bg-gradient-to-r ${zone.gradient} opacity-[0.04] transition-opacity duration-500`} />

        <div className="relative p-4 space-y-3">
          {/* Zone indicator + Commission percentage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`px-2.5 py-1 rounded-lg ${zone.bg} ${zone.border} border`}>
                <span className={`text-[10px] font-bold ${zone.color} uppercase tracking-wider`}>
                  {zone.label}
                </span>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Ma commission
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black bg-gradient-to-r ${zone.gradient} bg-clip-text text-transparent`}>
                {value}
              </span>
              <span className="text-sm font-bold text-muted-foreground">%</span>
            </div>
          </div>

          {/* ── THE SLIDER ── */}
          <div
            ref={sliderRef}
            className="relative py-2"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => { setShowTooltip(false); setIsDragging(false) }}
          >
            {/* Custom track background with gradient zones */}
            <div className="relative h-3 rounded-full bg-white/[0.06] overflow-hidden">
              {/* Zone backgrounds */}
              <div className="absolute inset-y-0 left-0 w-[33%] bg-emerald-500/[0.08]" />
              <div className="absolute inset-y-0 left-[33%] w-[33%] bg-amber-500/[0.08]" />
              <div className="absolute inset-y-0 left-[66%] w-[34%] bg-orange-500/[0.08]" />

              {/* Zone dividers */}
              <div className="absolute inset-y-0 left-[33%] w-px bg-white/[0.06]" />
              <div className="absolute inset-y-0 left-[66%] w-px bg-white/[0.06]" />

              {/* Filled range */}
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${zone.gradient} opacity-80`}
                style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
                transition={{ duration: isDragging ? 0 : 0.2 }}
              />

              {/* Shimmer on filled area */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
                style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
              />
            </div>

            {/* Actual Radix Slider (transparent track, custom thumb) */}
            <div className="absolute inset-0 pt-2">
              <Slider
                value={[value]}
                min={0}
                max={max}
                step={1}
                onValueChange={(v) => onChange(v[0])}
                onPointerDown={() => setIsDragging(true)}
                onPointerUp={() => setIsDragging(false)}
                className="w-full
                  [&_[data-slot=slider-track]]:h-3 [&_[data-slot=slider-track]]:bg-transparent [&_[data-slot=slider-track]]:rounded-full
                  [&_[data-slot=slider-range]]:bg-transparent
                  [&_[data-slot=slider-thumb]]:w-6 [&_[data-slot=slider-thumb]]:h-6 [&_[data-slot=slider-thumb]]:border-2
                  [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-lg [&_[data-slot=slider-thumb]]:shadow-orange-500/30
                  [&_[data-slot=slider-thumb]]:hover:shadow-xl [&_[data-slot=slider-thumb]]:hover:shadow-orange-500/40
                  [&_[data-slot=slider-thumb]]:transition-shadow [&_[data-slot=slider-thumb]]:cursor-grab
                  [&_[data-slot=slider-thumb]]:active:cursor-grabbing
                  [&_[data-slot=slider-thumb]]:border-orange-400"
              />
            </div>

            {/* Tick marks below slider */}
            <div className="relative flex justify-between mt-1.5 px-0">
              {ticks.map((tick) => (
                <div key={tick} className="flex flex-col items-center">
                  <div className="w-px h-1.5 bg-white/10" />
                  <span className="text-[9px] text-muted-foreground/50 mt-0.5">{tick}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Quick Preset Buttons ── */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground/50 mr-1">Rapide:</span>
            {presets.map((preset) => (
              <motion.button
                key={preset}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onChange(preset)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  value === preset
                    ? `bg-gradient-to-r ${zone.gradient} text-white shadow-md`
                    : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/60 border border-white/[0.06]'
                }`}
              >
                {preset}%
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Price Breakdown ── */}
      <div className="grid grid-cols-3 gap-2">
        <PriceBubble
          label="Prix de base"
          amount={basePrice}
          color="bg-white/[0.03] border-white/[0.06]"
          icon={Package}
          delay={0}
        />
        <PriceBubble
          label="Ma commission"
          amount={commissionAmount}
          color={`${zone.bg} ${zone.border}`}
          icon={Coins}
          delay={0.05}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r ${zone.gradient} border ${zone.border} backdrop-blur-sm relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
          <Sparkles className="w-4 h-4 shrink-0 relative" />
          <div className="min-w-0 relative">
            <p className="text-[10px] opacity-60 leading-none mb-0.5">Prix client</p>
            <AnimatedCounter value={finalPrice} className="text-sm font-black leading-none" />
          </div>
        </motion.div>
      </div>

      {/* ── Visual Price Comparison Bar ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground/50 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Répartition du prix client
          </span>
          <span className="text-muted-foreground/40">
            {value > 0 ? `+${value}% vs prix de base` : 'Prix de base'}
          </span>
        </div>
        <div className="relative h-8 rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06]">
          {/* Base price portion */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/[0.06] to-white/[0.03] flex items-center justify-center"
            style={{ width: `${value > 0 ? (basePrice / finalPrice) * 100 : 100}%` }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-[9px] font-medium text-white/40 whitespace-nowrap px-2">
              Base {formatPrice(basePrice)}
            </span>
          </motion.div>
          {/* Commission portion */}
          {value > 0 && (
            <motion.div
              className={`absolute inset-y-0 right-0 bg-gradient-to-r ${zone.gradient} opacity-20 flex items-center justify-center`}
              style={{ width: `${(commissionAmount / finalPrice) * 100}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${(commissionAmount / finalPrice) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className={`text-[9px] font-bold ${zone.color} whitespace-nowrap px-1`}>
                +{formatPrice(commissionAmount)}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Earnings Preview ── */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/10">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Gain par vente</p>
          <div className="flex items-baseline gap-2">
            <AnimatedCounter value={commissionAmount} className="text-lg font-black text-emerald-400" />
            <span className="text-[10px] text-muted-foreground/50">
              (+{value}% du prix de base)
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-muted-foreground/50">+ Clics</p>
          <p className="text-sm font-bold text-emerald-400 flex items-center gap-0.5">
            <MousePointerClick className="w-3 h-3" />
            5 FCFA/clic
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Marketing Share Modal ────────────────────────────────────────
function MarketingShareModal({
  open,
  onClose,
  productName,
  basePrice,
  commissionPct,
  imageUrl,
  shareLink,
  description,
  category,
}: {
  open: boolean
  onClose: () => void
  productName: string
  basePrice: number
  commissionPct: number
  imageUrl?: string
  shareLink: string
  description?: string
  category?: string
}) {
  const [copied, setCopied] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [aiText, setAiText] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiModel, setAiModel] = useState<string | null>(null)
  const [nativeShareSupported] = useState(() => {
    if (typeof navigator === 'undefined') return false
    return !!navigator.share
  })

  const finalPrice = basePrice * (1 + commissionPct / 100)

  // Generate AI marketing text when modal opens
  const generateAiText = useCallback(async () => {
    setAiLoading(true)
    setAiText(null)
    try {
      const res = await fetch('/api/generate-marketing-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          basePrice,
          commissionPct,
          description,
          category,
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
  }, [productName, basePrice, commissionPct, description, category, shareLink])

  // Auto-generate when modal opens
  useEffect(() => {
    if (open && productName) {
      generateAiText()
    }
    if (!open) {
      setAiText(null)
      setAiModel(null)
    }
  }, [open, productName, generateAiText])

  const marketingMessages = useMemo(() => {
    const imageNote = imageUrl ? ' 📸 Voir l\'image dans le lien' : ''
    return [
      {
        label: '🔥 Offre flash',
        message: `🔥 OFFRE EXCLUSIVE ! ${productName} à seulement ${formatPrice(finalPrice)} ! Commandez maintenant, stock limité !${imageNote} 👉 ${shareLink}`,
      },
      {
        label: '💯 Recommandation',
        message: `💯 J'ai trouvé ce produit incroyable : ${productName} à ${formatPrice(finalPrice)}. Qualité garantie !${imageNote} 👉 ${shareLink}`,
      },
      {
        label: '⏰ Urgence',
        message: `⏰ Dernière chance ! ${productName} à ${formatPrice(finalPrice)}. Ne ratez pas cette offre !${imageNote} 👉 ${shareLink}`,
      },
      {
        label: '🎁 Cadeau',
        message: `🎁 Offrez-vous ${productName} ! Seulement ${formatPrice(finalPrice)}. Livraison rapide !${imageNote} 👉 ${shareLink}`,
      },
    ]
  }, [productName, finalPrice, shareLink, imageUrl])

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
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Découvrez ${productName} à ${formatPrice(finalPrice)} !`)}&url=${encodeURIComponent(shareLink)}`, '_blank')
  }

  // Native share with image file attached
  const shareWithImage = async () => {
    if (!imageUrl) return
    setImageLoading(true)
    try {
      // Fetch image through proxy to avoid CORS issues
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
      const res = await fetch(proxyUrl)
      if (!res.ok) throw new Error('Failed to fetch image')

      const blob = await res.blob()
      const contentType = res.headers.get('Content-Type') || 'image/png'
      const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : contentType.includes('webp') ? 'webp' : 'png'
      const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`
      const imageFile = new File([blob], fileName, { type: contentType })

      const shareData = {
        title: productName,
        text: `Découvrez ${productName} à ${formatPrice(finalPrice)} ! Commandez maintenant 👉`,
        url: shareLink,
        files: [imageFile],
      }

      // Check if sharing files is supported
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: share without image
        await navigator.share({
          title: productName,
          text: `Découvrez ${productName} à ${formatPrice(finalPrice)} ! 📸 Voir l'image dans le lien`,
          url: shareLink,
        })
      }
    } catch (err) {
      // User cancelled or share failed — fallback to simple share
      if (err instanceof Error && err.name !== 'AbortError') {
        try {
          await navigator.share({
            title: productName,
            text: `Découvrez ${productName} à ${formatPrice(finalPrice)} !`,
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

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="bg-[#0d0118]/98 backdrop-blur-2xl border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-white text-xl flex items-center gap-2">
            <Share2 className="w-5 h-5 text-orange-400" />
            Outils Marketing
          </SheetTitle>
          <SheetDescription className="text-white/50">
            Partagez <strong className="text-white/70">{productName}</strong> et gagnez {formatPrice(basePrice * commissionPct / 100)} par vente + 5 FCFA/clic
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

          {/* Product Image Preview - Always shown, with image or placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden border border-white/10"
          >
            <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-orange-500/5 via-pink-500/5 to-purple-500/5">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-white/[0.03]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-white/20" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{productName}</p>
                <p className="text-xs text-white/40 mt-0.5">Prix client : {formatPrice(finalPrice)}</p>
                {imageUrl ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <ImageIcon className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400/70">Image jointe au partage</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-1">
                    <ImageIcon className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] text-amber-400/70">Aucune image disponible</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Share with image button (native Web Share API) */}
          {imageUrl && nativeShareSupported && (
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
                {Array.from({ length: 25 }).map((_, i) => {
                  const x = Math.sin((i + 42) * 9301 + 49297) * 233280
                  const val = x - Math.floor(x)
                  return (
                    <div
                      key={i}
                      className={`rounded-sm ${val > 0.4 ? 'bg-white/20' : 'bg-transparent'}`}
                    />
                  )
                })}
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

// ─── Main RecommenderTab Component ───────────────────────────────
export function RecommenderTab() {
  const { user, recommenderProducts, token, setRecommenderProducts } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [localCommissions, setLocalCommissions] = useState<Record<string, number>>({})
  const [savingCommission, setSavingCommission] = useState<string | null>(null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareModalData, setShareModalData] = useState<{
    productName: string
    basePrice: number
    commissionPct: number
    imageUrl?: string
    shareLink: string
    description?: string
    category?: string
  } | null>(null)

  const userId = user?.id

  const fetchRecommenderData = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`/api/recommender?userId=${userId}`, { headers })
      if (res.ok) {
        const data = await res.json()
        const products = data.recommenderProducts || data.products || data || []
        setRecommenderProducts(products)
        // Initialize local commissions
        const comms: Record<string, number> = {}
        products.forEach((rp: typeof recommenderProducts[0]) => {
          comms[rp.id] = rp.commissionPct
        })
        setLocalCommissions(comms)
      }
    } catch (error) {
      console.error('Failed to fetch recommender data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, token, setRecommenderProducts])

  useEffect(() => {
    fetchRecommenderData()
  }, [fetchRecommenderData])

  const handleCommissionChange = (rpId: string, value: number) => {
    setLocalCommissions((prev) => ({ ...prev, [rpId]: value }))
  }

  const handleCommissionSave = async (rp: typeof recommenderProducts[0]) => {
    const commissionPct = localCommissions[rp.id] ?? rp.commissionPct
    setSavingCommission(rp.id)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/recommender', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          miniSiteId: rp.miniSiteId,
          commissionPct,
        }),
      })
      if (res.ok) {
        await fetchRecommenderData()
      }
    } catch (error) {
      console.error('Failed to save commission:', error)
    } finally {
      setSavingCommission(null)
    }
  }

  const handleCopyLink = async (rp: typeof recommenderProducts[0]) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      await fetch('/api/recommender', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          miniSiteId: rp.miniSiteId,
          action: 'copyLink',
        }),
      })

      const slug = rp.miniSite?.slug
      if (slug) {
        const link = `${window.location.origin}/s/${slug}?ref=${userId}`
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
        setCopiedId(rp.id)
        setTimeout(() => setCopiedId(null), 2000)
        fetchRecommenderData()
      }
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleShareProduct = (rp: typeof recommenderProducts[0]) => {
    const product = rp.miniSite?.product
    const slug = rp.miniSite?.slug
    if (!product || !slug) return

    const imageUrl = product.images && product.images.length > 0
      ? product.images[0].storageUrl
      : undefined

    const shareLink = `${window.location.origin}/s/${slug}?ref=${userId}`

    setShareModalData({
      productName: product.name,
      basePrice: product.basePrice,
      commissionPct: localCommissions[rp.id] ?? rp.commissionPct,
      imageUrl,
      shareLink,
      description: product.description,
      category: product.category,
    })
    setShareModalOpen(true)
  }

  const getFinalPrice = (basePrice: number, commissionPct: number) => {
    return basePrice * (1 + commissionPct / 100)
  }

  const getSliderGradient = (value: number, max: number) => {
    const ratio = value / max
    if (ratio < 0.33) return 'from-emerald-400 to-emerald-500'
    if (ratio < 0.66) return 'from-emerald-400 via-amber-400 to-amber-500'
    return 'from-amber-400 via-orange-400 to-red-400'
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-52 rounded-lg bg-muted/30 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-4 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold gradient-text-warm flex items-center gap-2">
          <Share2 className="w-6 h-6 text-emerald-400" />
          Mes Produits Recommandés
        </h2>
        <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px]">
          <MousePointerClick className="w-3 h-3 mr-0.5" />
          Rémunéré/clic
        </Badge>
      </div>

      {/* Products */}
      {recommenderProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-12 text-center"
        >
          <Share2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun produit partagé</h3>
          <p className="text-muted-foreground">
            Partagez des produits pour commencer à gagner des commissions
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {recommenderProducts.map((rp, i) => {
              const product = rp.miniSite?.product
              const currentCommission = localCommissions[rp.id] ?? rp.commissionPct
              const maxCommission = product?.maxCommission ?? 40
              const basePrice = product?.basePrice ?? 0
              const finalPrice = getFinalPrice(basePrice, currentCommission)
              const sliderGradient = getSliderGradient(currentCommission, maxCommission)
              const isExpanded = expandedCard === rp.id
              const hasChanges = currentCommission !== rp.commissionPct
              const productImageUrl = product?.images && product.images.length > 0
                ? product.images[0].storageUrl
                : undefined

              return (
                <motion.div
                  key={rp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass rounded-xl overflow-hidden hover:border-orange-500/20 transition-colors"
                >
                  {/* Product Header - always visible */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedCard(isExpanded ? null : rp.id)}
                  >
                    {/* Product Image */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-emerald-500/10 to-orange-500/10 border border-white/[0.06]">
                      {productImageUrl ? (
                        <img
                          src={productImageUrl}
                          alt={product?.name ?? 'Produit'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-emerald-400/40" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {product?.name ?? 'Produit'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <Eye className="w-3 h-3 mr-0.5" />
                          {rp.visits} visites
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          Base: {formatPrice(basePrice)}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Final Price - always visible */}
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">Prix client</p>
                        <AnimatedCounter
                          value={finalPrice}
                          className="font-black text-lg bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
                        />
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                      </motion.div>
                    </div>
                  </div>

                  {/* ── Expandable Commission Slider ── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-white/[0.06] pt-4">
                          <CommissionSlider
                            value={currentCommission}
                            max={maxCommission}
                            onChange={(val) => handleCommissionChange(rp.id, val)}
                            basePrice={basePrice}
                          />

                          {/* Actions */}
                          <div className="flex gap-2 pt-4">
                            {/* Share button - primary action */}
                            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                size="sm"
                                className="w-full h-9 text-xs font-semibold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white shadow-lg shadow-orange-500/20"
                                onClick={() => handleShareProduct(rp)}
                              >
                                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                                Partager
                              </Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                size="sm"
                                className={`h-9 text-xs font-semibold transition-all ${
                                  hasChanges
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                                }`}
                                disabled={savingCommission === rp.id || !hasChanges}
                                onClick={() => handleCommissionSave(rp)}
                              >
                                {savingCommission === rp.id ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                                  />
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 mr-1.5" />
                                    {hasChanges ? 'Enregistrer' : 'Enregistré'}
                                  </>
                                )}
                              </Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 border-orange-500/30 hover:bg-orange-500/10 text-orange-400 text-xs px-4"
                                onClick={() => handleCopyLink(rp)}
                              >
                                {copiedId === rp.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                                    Copié !
                                  </>
                                ) : (
                                  <>
                                    <Link2 className="w-3.5 h-3.5 mr-1" />
                                    Lien
                                  </>
                                )}
                              </Button>
                            </motion.div>

                            {rp.miniSite?.slug && (
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-white/10 hover:bg-white/5 h-9 px-2.5"
                                  onClick={() => window.open(`/s/${rp.miniSite!.slug}?ref=${userId}`, '_blank')}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                              </motion.div>
                            )}
                          </div>

                          {/* Unsaved changes indicator */}
                          {hasChanges && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-1.5 mt-2 justify-center"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span className="text-[10px] text-amber-400/70">
                                Modifications non enregistrées
                              </span>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Help text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-xl p-4 space-y-2"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-semibold text-white/70">Comment ça marche ?</span>
        </div>
        <p className="text-[11px] text-white/30 leading-relaxed">
          Définissez le <strong className="text-white/50">taux de commission</strong> sur le curseur ci-dessus.
          Ce pourcentage s&apos;ajoute au prix de base pour donner le <strong className="text-orange-400/70">prix final que verra le client</strong>.
          Plus votre commission est élevée, plus vous gagnez par vente — mais le prix client augmente aussi.
          Vous gagnez également <strong className="text-emerald-400/70">5 FCFA par clic</strong> sur votre lien, même sans commande.
        </p>
      </motion.div>

      {/* Marketing Share Modal */}
      {shareModalData && (
        <MarketingShareModal
          open={shareModalOpen}
          onClose={() => { setShareModalOpen(false); setShareModalData(null) }}
          productName={shareModalData.productName}
          basePrice={shareModalData.basePrice}
          commissionPct={shareModalData.commissionPct}
          imageUrl={shareModalData.imageUrl}
          shareLink={shareModalData.shareLink}
          description={shareModalData.description}
          category={shareModalData.category}
        />
      )}
    </div>
  )
}
