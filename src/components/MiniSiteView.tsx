'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
} from 'framer-motion'
import {
  ShoppingBag,
  Send,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  MessageSquare,
  User,
  Package,
  ArrowLeft,
  Star,
  Shield,
  Truck,
  Clock,
  Heart,
  Share2,
  ChevronDown,
  ChevronUp,
  Zap,
  Award,
  Users,
  Check,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Weight,
  Ruler,
  Tag,
  Image as ImageIcon,
  TrendingUp,
  Coins,
  Copy,
  SlidersHorizontal,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useAppStore, formatPrice } from '@/lib/store'
import { Slider } from '@/components/ui/slider'

interface MiniSiteViewProps {
  slug: string
}

interface MiniSiteData {
  id: string
  productId: string
  slug: string
  createdAt: string
  product: {
    id: string
    name: string
    description: string
    basePrice: number
    category: string
    stock: number
    status: string
    maxCommission: number
    weight: string
    dimensions: string
    images: { id: string; storageUrl: string; position: number }[]
    owner: {
      id: string
      name: string | null
      phone: string
      role: string
    }
  }
}

// ─── CONFETTI PARTICLE ───
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const seededAngle = (delay * 137.5) % 360
  const seededDistance = 80 + (delay * 47) % 180

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{ background: color, left: '50%', top: '30%' }}
      initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
      animate={{
        scale: [0, 1.5, 0],
        x: Math.cos((seededAngle * Math.PI) / 180) * seededDistance,
        y: Math.sin((seededAngle * Math.PI) / 180) * seededDistance,
        rotate: 720,
      }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
    />
  )
}

function ConfettiBurst() {
  const colors = ['#f97316', '#ec4899', '#a855f7', '#fbbf24', '#34d399', '#f43f5e']
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {Array.from({ length: 24 }).map((_, i) => (
        <ConfettiParticle
          key={i}
          delay={i * 0.03}
          color={colors[i % colors.length]}
        />
      ))}
    </div>
  )
}

// ─── ANIMATED PRICE ───
function AnimatedPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number>(0)

  useEffect(() => {
    const duration = 1200
    const startTime = Date.now()
    const startVal = 0

    const step = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startVal + (value - startVal) * eased)
      setDisplay(current)

      if (progress < 1) {
        ref.current = requestAnimationFrame(step)
      }
    }

    ref.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(ref.current)
  }, [value])

  return <>{formatPrice(display)}</>
}

// ─── TRUST BADGE ───
function TrustBadge({ icon: Icon, label, desc }: { icon: React.ElementType; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center shrink-0 border border-orange-500/20">
        <Icon className="w-4 h-4 text-orange-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white/90">{label}</p>
        <p className="text-[11px] text-white/40">{desc}</p>
      </div>
    </div>
  )
}

// ─── FEATURE CARD ───
function FeatureCard({ icon: Icon, title, desc, delay }: { icon: React.ElementType; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-orange-500/20 transition-colors"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-purple-500/20 flex items-center justify-center mb-3 border border-white/10">
        <Icon className="w-5 h-5 text-orange-400" />
      </div>
      <p className="text-sm font-semibold text-white/90 mb-1">{title}</p>
      <p className="text-[11px] text-white/40 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

// ─── SOCIAL PROOF NOTIFICATION ───
function SocialProofNotification({ index }: { index: number }) {
  const cities = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Ngaoundéré', 'Bertoua']
  const names = ['Marie T.', 'Jean K.', 'Fatou M.', 'Paul D.', 'Aminata B.', 'Ibrahim N.', 'Chantal F.', 'Emmanuel S.']
  const times = ['il y a 2 min', 'il y a 5 min', 'il y a 8 min', 'il y a 12 min', 'il y a 15 min', 'il y a 20 min', 'il y a 25 min', 'il y a 32 min']

  const seededIndex = index % cities.length

  return (
    <motion.div
      initial={{ opacity: 0, x: -30, y: 0 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-40 pointer-events-none"
    >
      <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-2xl shadow-orange-500/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500/30 to-pink-500/30 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-orange-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/90">
              {names[seededIndex]} · {cities[seededIndex]}
            </p>
            <p className="text-[10px] text-white/40 flex items-center gap-1">
              <ShoppingBag className="w-2.5 h-2.5" />
              vient de commander · {times[seededIndex]}
            </p>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>
      </div>
    </motion.div>
  )
}

// ─── STICKY CTA BAR ───
function StickyCTA({ onClick, price, disabled, hide }: { onClick: () => void; price: number; disabled: boolean; hide: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show once past hero section (roughly 60vh)
      setVisible(window.scrollY > window.innerHeight * 0.5)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (hide) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
        >
          <div className="bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 py-3">
            <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-white/40">Prix</p>
                <p className="text-lg font-black bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                  <AnimatedPrice value={price} />
                </p>
              </div>
              <motion.button
                onClick={onClick}
                disabled={disabled}
                className="flex-1 max-w-[240px] h-12 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-bold text-sm shadow-xl relative overflow-hidden disabled:opacity-60"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400"
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ filter: 'blur(20px)' }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Commander
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── SCROLL SECTION WRAPPER ───
function ScrollSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── HERO IMAGE CAROUSEL ───
function HeroCarousel({ images, productName, category, stock }: {
  images: { id: string; storageUrl: string; position: number }[]
  productName: string
  category: string
  stock: number
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const hasMultiple = images.length > 1

  // Auto-advance
  useEffect(() => {
    if (!hasMultiple) return
    const interval = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [hasMultiple, images.length])

  const goTo = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50 && hasMultiple) {
      if (diff > 0) {
        setDirection(1)
        setCurrentIndex((prev) => (prev + 1) % images.length)
      } else {
        setDirection(-1)
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
      }
    }
  }

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 80 : -80, scale: 0.95 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -80 : 80, scale: 0.95 }),
  }

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const heroScale = useTransform(scrollY, [0, 400], [1, 1.08])

  return (
    <motion.div ref={heroRef} style={{ opacity: heroOpacity, scale: heroScale }} className="relative">
      <div
        className="relative w-full aspect-square overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]?.storageUrl || '/product-hero.png'}
            alt={`${productName} - Image ${currentIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0118] via-[#0a0118]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0118]/60 via-transparent to-transparent" />

        {/* Floating badges */}
        <div className="absolute top-16 left-4 right-4 flex justify-between items-start z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10"
          >
            <span className="text-white/80 text-xs font-medium capitalize">
              {category}
            </span>
          </motion.div>

          {stock > 0 && stock <= 20 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-red-500/80 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-bold">
                Plus que {stock} !
              </span>
            </motion.div>
          )}
        </div>

        {/* Navigation arrows (desktop) */}
        {hasMultiple && (
          <>
            <button
              onClick={() => {
                setDirection(-1)
                setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 opacity-0 hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => {
                setDirection(1)
                setCurrentIndex((prev) => (prev + 1) % images.length)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 opacity-0 hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {hasMultiple && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-6 bg-white/90'
                    : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent pointer-events-none"
          animate={{ x: ['-200%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
        />
      </div>
    </motion.div>
  )
}

// ─── PARALLAX IMAGE SECTION ───
function ParallaxImageSection({ src, alt, overlayText, overlaySubtext }: {
  src: string
  alt: string
  overlayText: string
  overlaySubtext: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1.05, 1.1])
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="relative rounded-2xl overflow-hidden"
    >
      <motion.div style={{ y, scale }} className="w-full h-56 sm:h-64">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0118] via-[#0a0118]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0118]/30 via-transparent to-[#0a0118]/30" />
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-white/90 text-base font-semibold mb-1"
        >
          {overlayText}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-white/40 text-xs"
        >
          {overlaySubtext}
        </motion.p>
      </div>
    </motion.div>
  )
}

// ─── HORIZONTAL GALLERY ───
function HorizontalGallery({ images, productName }: {
  images: { id: string; storageUrl: string; position: number }[]
  productName: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(scrollRef, { once: true, margin: '-50px' })

  if (images.length === 0) return null

  return (
    <div ref={scrollRef}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="overflow-x-auto scrollbar-hide"
      >
        <div className="flex gap-3 pb-2 px-1">
          {images.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="shrink-0 w-36 h-36 sm:w-44 sm:h-44 rounded-xl overflow-hidden border border-white/[0.08] group"
            >
              <img
                src={img.storageUrl}
                alt={`${productName} - ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ─── SPECIFICATION ITEM ───
function SpecItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-b-0">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500/15 to-pink-500/15 flex items-center justify-center shrink-0 border border-white/5">
        <Icon className="w-4 h-4 text-orange-400/80" />
      </div>
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-white/70 font-medium">{value}</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ─── MAIN MINISITEVIEW COMPONENT ───
// ═══════════════════════════════════════════════════════════════════
export default function MiniSiteView({ slug }: MiniSiteViewProps) {
  const { setCurrentView } = useAppStore()

  const [miniSite, setMiniSite] = useState<MiniSiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orderSheetOpen, setOrderSheetOpen] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [showRecommendOffer, setShowRecommendOffer] = useState(false)
  const [recommendCommission, setRecommendCommission] = useState(10)
  const [shareLink, setShareLink] = useState('')
  const [shareCopied, setShareCopied] = useState(false)
  const [isSavingCommission, setIsSavingCommission] = useState(false)

  // Order form fields
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerMessage, setCustomerMessage] = useState('')

  // Referrer ID from URL
  const [referrerId, setReferrerId] = useState<string | null>(null)
  const [commissionPct, setCommissionPct] = useState(0)
  const [clickTracked, setClickTracked] = useState(false)

  // UI state
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [liked, setLiked] = useState(false)
  const [showShareToast, setShowShareToast] = useState(false)
  const [socialProofIndex, setSocialProofIndex] = useState(-1)

  // Helper to get product images or fallback
  const getProductImages = useCallback((product: MiniSiteData['product']) => {
    if (product.images && product.images.length > 0) {
      return product.images
    }
    return [{ id: 'fallback', storageUrl: '/product-hero.png', position: 0 }]
  }, [])

  // Fetch mini-site data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams(window.location.search)
        const ref = params.get('ref')
        if (ref) setReferrerId(ref)

        const res = await fetch(`/api/mini-sites?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Produit introuvable')
          return
        }

        setMiniSite(data.miniSite)

        if (ref && data.miniSite) {
          try {
            const commRes = await fetch(
              `/api/recommender?userId=${ref}&miniSiteId=${data.miniSite.id}`
            )
            if (commRes.ok) {
              const commData = await commRes.json()
              if (commData.commissionPct !== undefined) {
                setCommissionPct(commData.commissionPct)
              }
            }
          } catch {
            // Commission lookup is optional
          }
        }
      } catch {
        setError('Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    if (slug) fetchData()
  }, [slug])

  // Track click when visitor arrives via referral link
  useEffect(() => {
    if (!miniSite || !referrerId || clickTracked) return

    const trackClick = async () => {
      try {
        const screenResolution = `${screen.width}x${screen.height}`
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const language = navigator.language
        const platform = navigator.platform
        const colorDepth = screen.colorDepth
        const hardwareConcurrency = navigator.hardwareConcurrency
        const touchSupport = 'ontouchstart' in window
        const deviceMemory = (navigator as unknown as Record<string, unknown>).deviceMemory as number | undefined

        await fetch('/api/clicks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recommenderId: referrerId,
            miniSiteId: miniSite.id,
            userAgent: navigator.userAgent,
            referer: document.referrer || undefined,
            sessionId: sessionStorage.getItem('clickSessionId') || undefined,
            screenResolution,
            timezone,
            language,
            platform,
            colorDepth,
            hardwareConcurrency,
            touchSupport,
            deviceMemory,
          }),
        })

        if (!sessionStorage.getItem('clickSessionId')) {
          sessionStorage.setItem('clickSessionId', `s_${Date.now()}_xyz`)
        }

        setClickTracked(true)
      } catch {
        // Silently fail
      }
    }

    trackClick()
  }, [miniSite, referrerId, clickTracked])

  // Social proof notification rotation
  useEffect(() => {
    if (!miniSite) return
    const interval = setInterval(() => {
      setSocialProofIndex((prev) => {
        if (prev === -1) return 0
        return prev + 1
      })
    }, 8000)
    const initialTimer = setTimeout(() => setSocialProofIndex(0), 5000)
    return () => {
      clearInterval(interval)
      clearTimeout(initialTimer)
    }
  }, [miniSite])

  // Calculate final price
  const finalPrice = miniSite
    ? miniSite.product.basePrice * (1 + commissionPct / 100)
    : 0

  // Submit order
  const handleOrderSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setOrderError('')

      if (!customerName || !customerPhone || !customerAddress) {
        setOrderError('Veuillez remplir tous les champs obligatoires')
        return
      }

      if (!miniSite) return

      setOrderLoading(true)

      try {
        const body: Record<string, unknown> = {
          miniSiteId: miniSite.id,
          customerName,
          customerPhone,
          customerAddress,
          customerMessage: customerMessage || null,
          finalPrice,
        }

        if (referrerId) {
          body.recommenderId = referrerId
        }

        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        const data = await res.json()

        if (!res.ok) {
          setOrderError(data.error || 'Erreur lors de la commande')
          setOrderLoading(false)
          return
        }

        setOrderSuccess(true)
        // Show recommendation offer after a short delay
        setTimeout(() => setShowRecommendOffer(true), 1500)
      } catch {
        setOrderError('Erreur réseau. Réessayez.')
        setOrderLoading(false)
      }
    },
    [miniSite, customerName, customerPhone, customerAddress, customerMessage, finalPrice, referrerId]
  )

  // Share handler
  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareText = `Découvrez ${miniSite?.product.name || 'ce produit'} - seulement ${formatPrice(finalPrice)} !`

    if (navigator.share) {
      try {
        await navigator.share({ title: miniSite?.product.name, text: shareText, url: shareUrl })
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setShowShareToast(true)
        setTimeout(() => setShowShareToast(false), 2500)
      } catch {
        // Fallback
      }
    }
  }

  // WhatsApp order
  const handleWhatsApp = () => {
    if (!miniSite) return
    const product = miniSite.product
    const ownerPhone = product.owner.phone.replace(/^0/, '237').replace(/\s/g, '')
    const msg = encodeURIComponent(
      `Bonjour ! Je souhaite commander : ${product.name} à ${formatPrice(finalPrice)}.\n\nMon nom : ${customerName || '[à remplir]'}\nMon téléphone : ${customerPhone || '[à remplir]'}\nAdresse : ${customerAddress || '[à remplir]'}`
    )
    window.open(`https://wa.me/${ownerPhone}?text=${msg}`, '_blank')
  }

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0520] via-[#1a0a35] to-[#0f0520]">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center"
          >
            <img src="/icon.png" alt="Loading" className="w-10 h-10 object-contain drop-shadow-md" />
          </motion.div>
          <p className="text-white/40 text-sm">Chargement du produit...</p>
        </motion.div>
      </div>
    )
  }

  // ─── ERROR STATE ───
  if (error || !miniSite) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f0520] via-[#1a0a35] to-[#0f0520] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto">
            <Package className="w-10 h-10 text-white/20" />
          </div>
          <p className="text-white/60 text-lg">{error || 'Produit introuvable'}</p>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="ghost"
            className="text-orange-400 hover:text-orange-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l&apos;accueil
          </Button>
        </motion.div>
      </div>
    )
  }

  const product = miniSite.product
  const allImages = getProductImages(product)

  // Product features
  const productFeatures = [
    { icon: Shield, title: 'Qualité garantie', desc: 'Produit vérifié et certifié' },
    { icon: Truck, title: 'Livraison rapide', desc: 'Expédition sous 24-48h' },
    { icon: Star, title: 'Satisfaction client', desc: 'Note moyenne 4.8/5' },
    { icon: Clock, title: 'Support 7j/7', desc: 'Assistance disponible' },
  ]

  // Determine image for different sections
  const detailImage = allImages.length > 1 ? allImages[1] : allImages[0]
  const parallaxImage = allImages.length > 2 ? allImages[2] : allImages[allImages.length > 1 ? 1 : 0]
  const trustBgImage = allImages.length > 3 ? allImages[3] : allImages[0]

  // Seeded random for viewers count (deterministic)
  const viewerCount = ((product.name.length * 7) % 5) + 3

  return (
    <div className="min-h-screen bg-[#0a0118] relative overflow-hidden">
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-500/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px]" />
      </div>

      {/* Success confetti */}
      <AnimatePresence>
        {orderSuccess && <ConfettiBurst />}
      </AnimatePresence>

      {/* Social proof notifications */}
      <AnimatePresence mode="wait">
        {socialProofIndex >= 0 && socialProofIndex % 3 === 0 && !orderSheetOpen && (
          <SocialProofNotification key={socialProofIndex} index={socialProofIndex} />
        )}
      </AnimatePresence>

      {/* Share toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 backdrop-blur-lg text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg shadow-emerald-500/20"
          >
            <Check className="w-4 h-4 inline mr-1.5" />
            Lien copié !
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="bg-black/60 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
            <button
              onClick={() => (window.location.href = '/')}
              className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Retour</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-white/60" />
              </button>
              <button
                onClick={() => setLiked(!liked)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Heart className={`w-3.5 h-3.5 transition-colors ${liked ? 'text-red-400 fill-red-400' : 'text-white/60'}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ─── MAIN CONTENT ─── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-lg mx-auto relative z-10">

        {/* ━━━ 1. HERO CAROUSEL ━━━ */}
        <HeroCarousel
          images={allImages}
          productName={product.name}
          category={product.category}
          stock={product.stock}
        />

        {/* Content sections with negative margin to overlap hero */}
        <div className="relative -mt-20 px-4 pb-32 space-y-8">

          {/* ━━━ 2. PRODUCT INFO ━━━ */}
          <ScrollSection>
            <div className="space-y-4">
              {/* Product Name & Seller */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                    {product.name}
                  </h1>
                  {product.owner.name && (
                    <p className="text-white/30 text-xs mt-1 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Vendu par <span className="text-white/50">{product.owner.name}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <div className="flex items-end gap-3">
                  {commissionPct > 0 && (
                    <span className="text-white/20 text-sm line-through mb-0.5">
                      {formatPrice(product.basePrice)}
                    </span>
                  )}
                  <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    <AnimatedPrice value={finalPrice} />
                  </span>
                </div>
                {commissionPct > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 border border-orange-500/15"
                  >
                    <Sparkles className="w-3 h-3 text-orange-400" />
                    <span className="text-[10px] font-semibold text-orange-300/80">
                      Offre exclusive recommandée
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Rating stars */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-400/30 fill-yellow-400/30'}`}
                    />
                  ))}
                </div>
                <span className="text-white/40 text-xs">4.8 (127 avis)</span>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-emerald-400/60 text-xs flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  234 vendus
                </span>
              </div>
            </div>
          </ScrollSection>

          {/* ━━━ 3. DESCRIPTION ━━━ */}
          <ScrollSection delay={0.05}>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Description</h3>
              <div className="relative">
                <p className={`text-white/50 text-sm leading-relaxed ${!showFullDesc ? 'line-clamp-3' : ''}`}>
                  {product.description || 'Découvrez ce produit exceptionnel, sélectionné avec soin pour vous offrir la meilleure qualité. Commandez maintenant et profitez de la livraison rapide chez vous.'}
                </p>
                {product.description && product.description.length > 120 && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="text-orange-400 text-xs font-medium mt-1 flex items-center gap-0.5 hover:text-orange-300 transition-colors"
                  >
                    {showFullDesc ? (
                      <>Voir moins <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Voir plus <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </ScrollSection>

          {/* ━━━ 4. IMAGE SHOWCASE WITH PARALLAX ━━━ */}
          <ScrollSection delay={0.05}>
            <ParallaxImageSection
              src={parallaxImage.storageUrl}
              alt={`${product.name} - Qualité premium`}
              overlayText="Qualité premium garantie"
              overlaySubtext="Chaque produit est soigneusement sélectionné et vérifié"
            />
          </ScrollSection>

          {/* ━━━ 5. FEATURES GRID ━━━ */}
          <ScrollSection delay={0.05}>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Pourquoi choisir ce produit
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {productFeatures.map((feat, i) => (
                <FeatureCard
                  key={feat.title}
                  icon={feat.icon}
                  title={feat.title}
                  desc={feat.desc}
                  delay={0.1 + i * 0.08}
                />
              ))}
            </div>
          </ScrollSection>

          {/* ━━━ 6. HORIZONTAL GALLERY ━━━ */}
          {allImages.length > 0 && (
            <ScrollSection delay={0.05}>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-orange-400/60" />
                  Galerie photos
                </h3>
                <HorizontalGallery
                  images={allImages}
                  productName={product.name}
                />
              </div>
            </ScrollSection>
          )}

          {/* ━━━ 7. SPECIFICATIONS ━━━ */}
          {(product.weight || product.dimensions || product.category) && (
            <ScrollSection delay={0.05}>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
                Spécifications
              </h3>
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
                <SpecItem icon={Weight} label="Poids" value={product.weight} />
                <SpecItem icon={Ruler} label="Dimensions" value={product.dimensions} />
                <SpecItem icon={Tag} label="Catégorie" value={product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : ''} />
              </div>
            </ScrollSection>
          )}

          {/* ━━━ 8. TRUST INDICATORS WITH BACKGROUND IMAGE ━━━ */}
          <ScrollSection delay={0.05}>
            <div className="relative rounded-2xl overflow-hidden">
              {/* Background product image with overlay */}
              <div className="absolute inset-0">
                <img
                  src={trustBgImage.storageUrl}
                  alt=""
                  className="w-full h-full object-cover opacity-15"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0118]/90 via-[#0a0118]/85 to-[#0a0118]/90" />
              </div>
              <div className="relative z-10 p-4">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Achetez en confiance
                </h3>
                <div className="divide-y divide-white/5">
                  <TrustBadge
                    icon={Shield}
                    label="Paiement sécurisé"
                    desc="Vos données sont protégées"
                  />
                  <TrustBadge
                    icon={Truck}
                    label="Livraison garantie"
                    desc="Remboursement si non livré"
                  />
                  <TrustBadge
                    icon={CheckCircle2}
                    label="Produit authentique"
                    desc="Certifié par le vendeur"
                  />
                  <TrustBadge
                    icon={MessageSquare}
                    label="Support réactif"
                    desc="Réponse sous 2 heures"
                  />
                </div>
              </div>
            </div>
          </ScrollSection>

          {/* ━━━ 9. URGENCY BANNER ━━━ */}
          {product.stock > 0 && product.stock <= 15 && (
            <ScrollSection delay={0.05}>
              <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-400">
                      Stock limité !
                    </p>
                    <p className="text-xs text-white/40">
                      Plus que {product.stock} disponibles — {viewerCount} personnes regardent ce produit
                    </p>
                  </div>
                </div>
              </div>
            </ScrollSection>
          )}

          {/* ━━━ 10. REVIEWS ━━━ */}
          <ScrollSection delay={0.05}>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                Avis clients
              </h3>
              <div className="space-y-2">
                {[
                  { name: 'Marie T.', rating: 5, text: 'Excellent produit ! La qualité est au rendez-vous, je recommande vivement.', time: 'Il y a 2 jours' },
                  { name: 'Jean K.', rating: 5, text: 'Livraison rapide et produit conforme. Très satisfait !', time: 'Il y a 5 jours' },
                  { name: 'Fatou M.', rating: 4, text: 'Bon rapport qualité-prix. Je commanderai à nouveau.', time: 'Il y a 1 semaine' },
                ].map((review, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500/30 to-pink-500/30 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white/70">{review.name[0]}</span>
                        </div>
                        <span className="text-xs font-medium text-white/70">{review.name}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: review.rating }).map((_, j) => (
                          <Star key={j} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">{review.text}</p>
                    <p className="text-[10px] text-white/20 mt-1">{review.time}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollSection>

          {/* ━━━ MAIN CTA (before footer) ━━━ */}
          <ScrollSection delay={0.05}>
            <div className="space-y-3">
              <motion.button
                onClick={() => setOrderSheetOpen(true)}
                disabled={orderSuccess}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-bold text-lg shadow-2xl shadow-orange-500/30 relative overflow-hidden group disabled:opacity-60"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Animated glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400"
                  animate={{ opacity: [0, 0.4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ filter: 'blur(20px)' }}
                />
                {/* Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Commander maintenant
                </span>
              </motion.button>

              {/* WhatsApp CTA */}
              <motion.button
                onClick={handleWhatsApp}
                className="w-full h-12 rounded-2xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <MessageSquare className="w-4 h-4" />
                Commander via WhatsApp
              </motion.button>

              <p className="text-white/20 text-[10px] text-center flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Commande sécurisée · Vendeur vérifié
              </p>
            </div>
          </ScrollSection>

          {/* ━━━ 11. FOOTER ━━━ */}
          <ScrollSection delay={0.05}>
            <div className="pt-6 pb-4 border-t border-white/5 text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-bold gradient-text-warm">Kidenzo</span>
              </div>
              <p className="text-white/20 text-[10px]">
                Plateforme de recommandation sécurisée · © {new Date().getFullYear()}
              </p>
            </div>
          </ScrollSection>
        </div>
      </div>

      {/* ─── STICKY CTA ─── */}
      <StickyCTA
        onClick={() => setOrderSheetOpen(true)}
        price={finalPrice}
        disabled={orderSuccess}
        hide={orderSheetOpen}
      />

      {/* ─── ORDER SHEET ─── */}
      <Sheet open={orderSheetOpen} onOpenChange={(open) => {
        if (!orderLoading) {
          setOrderSheetOpen(open)
          if (!open) {
            setOrderError('')
          }
        }
      }}>
        <SheetContent side="bottom" className="bg-[#0a0118]/98 backdrop-blur-2xl border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="px-0">
            <SheetTitle className="text-white text-xl">
              {orderSuccess ? 'Commande envoyée !' : 'Passer la commande'}
            </SheetTitle>
            <SheetDescription className="text-white/50">
              {orderSuccess
                ? 'Votre commande a été envoyée avec succès'
                : `Remplissez vos informations pour commander ${product.name}`}
            </SheetDescription>
          </SheetHeader>

          <AnimatePresence mode="wait">
            {orderSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 py-4"
              >
                {/* ─── SUCCESS HEADER ─── */}
                <div className="flex flex-col items-center space-y-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                  <p className="text-white text-lg font-semibold">
                    Commande envoyée !
                  </p>
                  <p className="text-white/50 text-sm text-center max-w-xs">
                    Vous recevrez une confirmation par téléphone très prochainement.
                  </p>
                </div>

                {/* ─── RECOMMENDATION OFFER ─── */}
                <AnimatePresence>
                  {showRecommendOffer && miniSite && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 p-4 rounded-2xl bg-gradient-to-b from-orange-500/10 via-pink-500/5 to-purple-500/10 border border-orange-500/15">
                        {/* Offer Header */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/30 to-pink-500/30 flex items-center justify-center shrink-0 border border-orange-500/20">
                            <Coins className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white/90">Gagnez de l&apos;argent</p>
                            <p className="text-[11px] text-white/40">Recommandez ce produit à votre entourage</p>
                          </div>
                        </div>

                        {/* Commission Display */}
                        {referrerId ? (
                          /* Came from a recommender - show inherited commission */
                          <div className="space-y-2">
                            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Commission héritée</p>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                                  {commissionPct}%
                                </span>
                                <span className="text-xs text-white/30">par vente</span>
                              </div>
                              <p className="text-[10px] text-white/25 mt-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Commission du recommandeur qui vous a référé
                              </p>
                            </div>
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10">
                              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                              <p className="text-[10px] text-emerald-400/70">
                                Gagnez <strong className="text-emerald-300">{formatPrice(product.basePrice * commissionPct / 100)}</strong> par vente + 5 FCFA/clic
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* Direct order - let them set their own commission */
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400/60" />
                                  <span className="text-xs text-white/50">Votre commission</span>
                                </div>
                                <div className="flex items-baseline gap-0.5">
                                  <span className="text-xl font-black bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                                    {recommendCommission}
                                  </span>
                                  <span className="text-xs font-bold text-white/30">%</span>
                                </div>
                              </div>
                              <div className="relative">
                                <div className="relative h-3 rounded-full bg-white/[0.06] overflow-hidden">
                                  <div className="absolute inset-y-0 left-0 w-[33%] bg-emerald-500/[0.08]" />
                                  <div className="absolute inset-y-0 left-[33%] w-[33%] bg-amber-500/[0.08]" />
                                  <div className="absolute inset-y-0 left-[66%] w-[34%] bg-orange-500/[0.08]" />
                                  <motion.div
                                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 opacity-80"
                                    style={{ width: `${(recommendCommission / (product.maxCommission || 40)) * 100}%` }}
                                  />
                                </div>
                                <div className="absolute inset-0">
                                  <Slider
                                    value={[recommendCommission]}
                                    min={0}
                                    max={product.maxCommission || 40}
                                    step={1}
                                    onValueChange={(v) => setRecommendCommission(v[0])}
                                    className="w-full
                                      [&_[data-slot=slider-track]]:h-3 [&_[data-slot=slider-track]]:bg-transparent
                                      [&_[data-slot=slider-range]]:bg-transparent
                                      [&_[data-slot=slider-thumb]]:w-6 [&_[data-slot=slider-thumb]]:h-6 [&_[data-slot=slider-thumb]]:border-2
                                      [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-lg [&_[data-slot=slider-thumb]]:shadow-orange-500/30
                                      [&_[data-slot=slider-thumb]]:border-orange-400 [&_[data-slot=slider-thumb]]:cursor-grab
                                      [&_[data-slot=slider-thumb]]:active:cursor-grabbing"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10">
                              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                              <p className="text-[10px] text-emerald-400/70">
                                Gagnez <strong className="text-emerald-300">{formatPrice(product.basePrice * recommendCommission / 100)}</strong> par vente + 5 FCFA/clic
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Share Link */}
                        <div className="space-y-2">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider">Votre lien de recommandation</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/50 text-[10px] truncate font-mono">
                              {shareLink || `${window.location.origin}/s/${miniSite.slug}`}
                            </div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  const link = `${window.location.origin}/s/${miniSite.slug}`
                                  setShareLink(link)
                                  try {
                                    await navigator.clipboard.writeText(link)
                                    setShareCopied(true)
                                    setTimeout(() => setShareCopied(false), 2000)
                                  } catch {
                                    // fallback
                                  }
                                }}
                                className="h-8 px-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px]"
                              >
                                {shareCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </Button>
                            </motion.div>
                          </div>
                        </div>

                        {/* Share Button */}
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                          <Button
                            onClick={async () => {
                              const link = `${window.location.origin}/s/${miniSite.slug}`
                              const commissionToUse = referrerId ? commissionPct : recommendCommission
                              const shareText = `🔥 Découvrez ${product.name} à seulement ${formatPrice(product.basePrice * (1 + commissionToUse / 100))} ! Qualité garantie 👉 ${link}`
                              if (navigator.share) {
                                try {
                                  await navigator.share({ title: product.name, text: shareText, url: link })
                                } catch {
                                  // User cancelled
                                }
                              } else {
                                try {
                                  await navigator.clipboard.writeText(shareText)
                                  setShareCopied(true)
                                  setTimeout(() => setShareCopied(false), 2000)
                                } catch {
                                  // fallback
                                }
                              }
                            }}
                            disabled={isSavingCommission}
                            className="w-full h-11 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-orange-500/20 relative overflow-hidden"
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400"
                              animate={{ opacity: [0, 0.3, 0] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                              style={{ filter: 'blur(15px)' }}
                            />
                            <span className="relative flex items-center justify-center gap-2">
                              {isSavingCommission ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                              {isSavingCommission ? 'Enregistrement...' : 'Recommander & Gagner'}
                            </span>
                          </Button>
                        </motion.div>

                        {/* WhatsApp share */}
                        <motion.button
                          onClick={() => {
                            const link = `${window.location.origin}/s/${miniSite.slug}`
                            const commissionToUse = referrerId ? commissionPct : recommendCommission
                            const msg = encodeURIComponent(
                              `🔥 Découvrez ${product.name} à ${formatPrice(product.basePrice * (1 + commissionToUse / 100))} ! Qualité garantie 👉 ${link}`
                            )
                            window.open(`https://wa.me/?text=${msg}`, '_blank')
                          }}
                          className="w-full h-10 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Partager sur WhatsApp
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── ACTION BUTTONS ─── */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleWhatsApp}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Suivre sur WhatsApp
                  </Button>
                  <Button
                    onClick={() => setOrderSheetOpen(false)}
                    variant="outline"
                    className="border-white/20 text-white/60 hover:text-white"
                  >
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
                onSubmit={handleOrderSubmit}
                className="space-y-4 pt-2"
              >
                {/* Price summary */}
                <div className="bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 rounded-xl p-4 border border-orange-500/10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-white/80 text-sm font-medium">{product.name}</p>
                        <p className="text-white/30 text-[10px] capitalize">{product.category}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                      {formatPrice(finalPrice)}
                    </span>
                  </div>
                </div>

                {/* Customer Name */}
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">
                    Nom complet *
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Jean Dupont"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-orange-400/50 focus-visible:ring-orange-400/20 h-12 rounded-xl"
                    />
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  </div>
                </div>

                {/* Customer Phone */}
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">
                    Téléphone *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base">
                      🇨🇲
                    </span>
                    <Input
                      type="tel"
                      placeholder="237XXXXXXXXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-orange-400/50 focus-visible:ring-orange-400/20 h-12 rounded-xl"
                    />
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  </div>
                </div>

                {/* Customer Address */}
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">
                    Adresse de livraison *
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Quartier, Ville"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-orange-400/50 focus-visible:ring-orange-400/20 h-12 rounded-xl"
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  </div>
                </div>

                {/* Customer Message */}
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">
                    Message (optionnel)
                  </Label>
                  <Textarea
                    placeholder="Instructions spéciales..."
                    value={customerMessage}
                    onChange={(e) => setCustomerMessage(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-orange-400/50 focus-visible:ring-orange-400/20 min-h-20 resize-none rounded-xl"
                  />
                </div>

                {/* Order error */}
                <AnimatePresence>
                  {orderError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0, x: [0, -5, 5, -5, 5, 0] }}
                      exit={{ opacity: 0 }}
                      className="bg-red-500/15 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm text-center flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {orderError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={orderLoading}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-400 hover:via-pink-400 hover:to-purple-400 text-white shadow-xl shadow-orange-500/20 transition-all duration-300 rounded-xl relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                  <span className="relative flex items-center justify-center gap-2">
                    {orderLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Confirmer la commande — {formatPrice(finalPrice)}
                      </>
                    )}
                  </span>
                </Button>

                <div className="flex items-center justify-center gap-4 pt-1">
                  <p className="text-white/20 text-[10px] flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Paiement sécurisé
                  </p>
                  <p className="text-white/20 text-[10px] flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Livraison garantie
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>
    </div>
  )
}
