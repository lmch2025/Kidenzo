'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform, Variants } from 'framer-motion'
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
  Menu,
} from 'lucide-react'
import { useAppStore, formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import MiniSiteView from './MiniSiteView'
import CommissionPopup from './CommissionPopup'
import MarketingShareModal from './MarketingShareModal'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import AuthScreen from '@/components/AuthScreen'

import { PRODUCT_CATEGORIES, CATEGORY_COLORS as categoryColors } from '@/lib/categories'

const CATEGORIES = [
  { value: 'all', label: 'Tous' },
  ...PRODUCT_CATEGORIES
]

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
    updatePublicProduct,
    setShowAuthModal,
    showAuthModal,
    authModalReason,
    isAuthenticated,
    user,
    token,
    setCurrentView,
    setDashboardTab,
    pendingAction,
    setPendingAction,
    clearPendingAction,
  } = useAppStore()

  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'kidenzo' | 'neolife'>('kidenzo')

  // ── Scroll-based UI liberation ──
  const [isScrolled, setIsScrolled] = useState(false)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    // Determine the scroll container
    // When embedded in DashboardLayout, it's the element with id="main-scroll-container"
    // Otherwise fallback to window (for example in standalone testing)
    const scrollContainer = document.getElementById('main-scroll-container') || window

    const handleScroll = (e: Event) => {
      // Get the scroll position depending on the container type
      const currentScrollY =
        scrollContainer === window
          ? window.scrollY
          : (e.target as HTMLElement).scrollTop

      if (currentScrollY > 60) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
        setIsCategoryMenuOpen(false)
      }
      lastScrollY.current = currentScrollY
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  // Close category dropdown when clicking outside
  useEffect(() => {
    if (!isCategoryMenuOpen) return
    const handleClickOutside = () => setIsCategoryMenuOpen(false)
    document.addEventListener('click', handleClickOutside, { once: true })
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isCategoryMenuOpen])

  // Product detail sheet state
  const [detailProduct, setDetailProduct] = useState<any>(null)
  const [savedScroll, setSavedScroll] = useState(0)

  const openProductDetail = (product: any) => {
    setSavedScroll(window.scrollY)
    setDetailProduct(product)
    window.scrollTo(0, 0)
  }

  const closeProductDetail = () => {
    setDetailProduct(null)
    setTimeout(() => {
      window.scrollTo(0, savedScroll)
    }, 0)
  }

  // Commission popup state
  const [commissionPopupOpen, setCommissionPopupOpen] = useState(false)
  const [commissionPopupProduct, setCommissionPopupProduct] = useState<{
    id: string; name: string; basePrice: number; maxCommission: number; recommenderMaxCommission?: number;
    description?: string; imageUrl?: string;
    miniSite?: { id: string; slug: string } | null;
  } | null>(null)
  const [savingCommission, setSavingCommission] = useState<string | null>(null)
  // Track the commission value the recommender chose (for restoration after auth)
  const [pendingCommission, setPendingCommission] = useState<number | null>(null)

  // Marketing share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareModalProduct, setShareModalProduct] = useState<{
    name: string; basePrice: number; imageUrl?: string; videoUrl?: string; description?: string; category?: string;
  } | null>(null)
  const [shareModalLink, setShareModalLink] = useState('')
  const [shareModalCommission, setShareModalCommission] = useState(0)

  // Direct order sheet state
  const [orderProduct, setOrderProduct] = useState<{
    id: string; name: string; basePrice: number; description: string;
    owner?: { name: string | null; phone: string };
  } | null>(null)
  const [orderSheetOpen, setOrderSheetOpen] = useState(false)

  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 50

  // Fetch public products
  const fetchProducts = useCallback(async (currentSkip: number) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/products?status=active&limit=${LIMIT}&skip=${currentSkip}`)
      if (res.ok) {
        const data = await res.json()
        const newProducts = data.products || data || []
        
        if (newProducts.length < LIMIT) {
          setHasMore(false)
        } else {
          setHasMore(true)
        }
        
        if (currentSkip === 0) {
          setPublicProducts(newProducts)
        } else {
          // Fetch current state safely
          const currentProducts = useAppStore.getState().publicProducts
          const existingIds = new Set(currentProducts.map(p => p.id))
          const uniqueNew = newProducts.filter((p: any) => !existingIds.has(p.id))
          setPublicProducts([...currentProducts, ...uniqueNew])
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [setPublicProducts])

  useEffect(() => {
    fetchProducts(0)
  }, [fetchProducts])

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextSkip = skip + LIMIT
      setSkip(nextSkip)
      fetchProducts(nextSkip)
    }
  }

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
            updatePublicProduct({ ...product, miniSite })
          }
        } catch {
          // Silently continue
        }
      }
    }
    if (publicProducts.length > 0 && !isLoading) {
      ensureMiniSites()
    }
  }, [isLoading, publicProducts, updatePublicProduct])

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = publicProducts.filter(p => p.status === 'active' && ((p as any).brand || 'kidenzo') === activeTab)

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
  }, [publicProducts, selectedCategory, searchQuery, activeTab])

  // Handle "Recommander & Gagner" click → toggle inline slider
  const handleRecommendClick = (product: typeof publicProducts[0]) => {
    setCommissionPopupProduct({
      id: product.id,
      name: product.name,
      basePrice: product.basePrice,
      maxCommission: product.recommenderMaxCommission ?? product.maxCommission,
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

      const product = publicProducts.find(p => p.id === productId)
      if (!product) return

      setSavingCommission(productId)
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        // Save commission
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
        const slug = product.miniSite?.slug
        if (slug) {
          const link = `${window.location.origin}/s/${slug}?ref=${user.id}`
          setShareModalProduct({
            name: product.name,
            basePrice: product.basePrice,
            imageUrl: product.images && product.images.length > 0 ? product.images[0].storageUrl : undefined,
            videoUrl: product.videoUrl || undefined,
            description: product.description,
            category: product.category,
          })
          setShareModalLink(link)
          setShareModalCommission(commissionPct)
          setShareModalOpen(true)
        }
      } catch (error) {
        console.error('Failed to save commission:', error)
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
          videoUrl: product.videoUrl || undefined,
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

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <div className="flex flex-col relative min-h-screen">
      {/* ── Background Effects ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
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

      {/* ── MiniSite Overlay ──── */}
      {detailProduct && detailProduct.miniSite && (
        <div className="w-full relative z-50 bg-[#0a0118] min-h-screen">
          <MiniSiteView slug={detailProduct.miniSite.slug} onClose={closeProductDetail} />
        </div>
      )}

      {/* ── Main Page Content ── */}
      <div style={{ display: detailProduct && detailProduct.miniSite ? 'none' : 'block' }} className="w-full">

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── UNIFIED STICKY HEADER (search + tabs)        ── */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-40 w-full">

        {/* ── Row 1: Search bar + burger on scroll ── */}
        <motion.div
          className="w-full bg-[#0a0118]/92 backdrop-blur-xl border-b border-white/5 px-4 overflow-visible"
          animate={{
            paddingTop: isScrolled ? 8 : 16,
            paddingBottom: isScrolled ? 8 : 16,
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="max-w-6xl mx-auto">
            {/* Search row */}
            <div className="flex items-center gap-2">
              {/* Burger — slides in from left on scroll */}
              <AnimatePresence>
                {isScrolled && (
                  <motion.div
                    key="burger"
                    initial={{ opacity: 0, width: 0, marginRight: 0 }}
                    animate={{ opacity: 1, width: 40, marginRight: 0 }}
                    exit={{ opacity: 0, width: 0, marginRight: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="relative shrink-0 overflow-visible"
                    style={{ minWidth: isScrolled ? 40 : 0 }}
                  >
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); setIsCategoryMenuOpen(prev => !prev) }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                        isCategoryMenuOpen
                          ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                          : selectedCategory !== 'all'
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                          : 'bg-white/5 border-white/10 text-white/50'
                      }`}
                    >
                      <motion.div
                        animate={{ rotate: isCategoryMenuOpen ? 45 : 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <Menu className="w-4 h-4" />
                      </motion.div>
                      {selectedCategory !== 'all' && !isCategoryMenuOpen && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 border border-[#0a0118]" />
                      )}
                    </motion.button>

                    {/* Category dropdown */}
                    <AnimatePresence>
                      {isCategoryMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-12 left-0 z-[60] w-56 bg-[#130828]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden py-1.5"
                        >
                          {CATEGORIES.map((cat, i) => (
                            <motion.button
                              key={cat.value}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.025 }}
                              onClick={() => { setSelectedCategory(cat.value); setIsCategoryMenuOpen(false) }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-medium flex items-center justify-between transition-colors ${
                                selectedCategory === cat.value
                                  ? 'text-orange-400 bg-orange-500/10'
                                  : 'text-white/60 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              {cat.label}
                              {selectedCategory === cat.value && (
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                              )}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <motion.div
                  animate={{ height: isScrolled ? 38 : 44 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-full bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-orange-400/50 rounded-xl"
                  />
                </motion.div>
              </div>
            </div>

            {/* Category pills — collapse on scroll */}
            <motion.div
              animate={{
                height: isScrolled ? 0 : 'auto',
                opacity: isScrolled ? 0 : 1,
                marginTop: isScrolled ? 0 : 10,
              }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
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
          </div>
        </motion.div>

        {/* ── Row 2: Kidenzo / Neolife tabs (always visible, compresses on scroll) ── */}
        <motion.div
          className="w-full bg-[#0a0118]/88 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/10"
          animate={{
            paddingTop: isScrolled ? 5 : 14,
            paddingBottom: isScrolled ? 5 : 14,
            paddingLeft: 12,
            paddingRight: 12,
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex max-w-md mx-auto p-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {/* Kidenzo */}
            <button
              onClick={() => setActiveTab('kidenzo')}
              className="relative flex-1 flex items-center justify-center gap-2 rounded-xl overflow-hidden transition-colors"
              style={{ minHeight: isScrolled ? 34 : 46 }}
            >
              <AnimatePresence initial={false}>
                {activeTab === 'kidenzo' && (
                  <motion.span
                    layoutId="tabActiveBg"
                    className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-orange-500/20"
                    style={{ borderRadius: 10 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                  />
                )}
              </AnimatePresence>
              <span className="relative z-10 flex items-center gap-1.5">
                <Package className={`transition-all duration-300 ${isScrolled ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'} ${activeTab === 'kidenzo' ? 'text-white' : 'text-orange-400'}`} />
                <motion.span
                  animate={{ fontSize: isScrolled ? '11px' : '13px' }}
                  transition={{ duration: 0.3 }}
                  className={`font-bold ${activeTab === 'kidenzo' ? 'text-white' : 'text-white/50'}`}
                >
                  {isScrolled ? 'Kidenzo' : 'Produits Kidenzo'}
                </motion.span>
              </span>
            </button>

            {/* Neolife */}
            <button
              onClick={() => setActiveTab('neolife')}
              className="relative flex-1 flex items-center justify-center gap-2 rounded-xl overflow-hidden transition-colors"
              style={{ minHeight: isScrolled ? 34 : 46 }}
            >
              <AnimatePresence initial={false}>
                {activeTab === 'neolife' && (
                  <motion.span
                    layoutId="tabActiveBg"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20"
                    style={{ borderRadius: 10 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                  />
                )}
              </AnimatePresence>
              <span className="absolute inset-0 z-10 flex items-center justify-center p-1">
                <img 
                  src="/logo_Neolife.jpg" 
                  alt="Neolife" 
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </span>
            </button>
          </div>
        </motion.div>

      </div>{/* end sticky wrapper */}


      {/* ── Products Grid ── */}
      <main className="relative z-10 flex-1 px-4 pt-4 pb-8 max-w-6xl mx-auto w-full">
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
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="glass-card rounded-2xl overflow-hidden group"
                >
                  {/* Clickable Area for Details */}
                  <div 
                    className="cursor-pointer group/clickable"
                    onClick={() => openProductDetail(product)}
                  >
                    {/* Product Image Area */}
                    <div className="relative h-44 bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-purple-500/10 flex items-center justify-center overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0].storageUrl}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-contain bg-black/10 group-hover:scale-105 transition-transform duration-500"
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

                      {/* "Voir les détails" visual indicator */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/clickable:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 transform translate-y-4 group-hover/clickable:translate-y-0 transition-transform duration-300">
                          <Eye className="w-4 h-4 text-white" />
                          <span className="text-white text-sm font-medium">Voir les détails</span>
                        </div>
                      </div>

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
                    <div className="p-5 space-y-3 pb-0">
                      <div>
                        <h3 className="font-bold text-white text-base leading-snug line-clamp-1 group-hover/clickable:text-orange-400 transition-colors">
                          {product.name}
                        </h3>
                      <p className="text-white/30 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                      </div>

                    {/* Price & Rewards */}
                    <div className="flex items-end justify-between px-5 pb-5">
                      <span className="text-2xl font-black gradient-text-warm">
                        {formatPrice(product.basePrice)}
                      </span>
                      <div className="flex flex-col items-end gap-1.5">
                        {(product.recommenderMaxCommission ?? product.maxCommission) > 0 && (
                          <span className="text-[10px] text-emerald-400/90 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg flex items-center justify-center gap-1 border border-emerald-500/20">
                            Jusqu&apos;à {product.recommenderMaxCommission ?? product.maxCommission}% de com.
                          </span>
                        )}
                        <span className="text-[10px] text-orange-400/90 bg-orange-500/10 px-2.5 py-0.5 rounded-lg flex items-center justify-center gap-1 border border-orange-500/20">
                          <Zap className="w-3 h-3" />
                          Gain : 5 FCFA / clic
                        </span>
                      </div>
                    </div>
                  </div>

                    {/* ── TWO MAIN BUTTONS ── */}
                    <div className="border-t border-white/5 pt-3 px-5 pb-5 space-y-2.5">
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

        {/* Load More Button */}
        {hasMore && filteredProducts.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={loadMore}
              disabled={isLoading}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full px-8 py-2 transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  Chargement...
                </>
              ) : (
                'Voir plus'
              )}
            </Button>
          </div>
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
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img 
              src="/icon.png" 
              alt="Kidenzo Logo" 
              className="w-6 h-6 object-contain" 
            />
            <span className="text-sm font-bold gradient-text-warm">Kidenzo</span>
          </div>
          <div className="flex items-center gap-4 text-white/20 text-[11px] flex-wrap justify-center">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Paiement sécurisé
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3" />
              Livraison garantie
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4 text-white/40 text-[11px] flex-wrap justify-center">
              <a href="/mentions-legales" className="hover:text-white transition-colors">Mentions Légales</a>
              <a href="/cgv" className="hover:text-white transition-colors">CGV</a>
              <a href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</a>
            </div>
            <div className="flex items-center gap-4 text-white/40 text-[11px] flex-wrap justify-center">
              <a href="/paiements" className="hover:text-white transition-colors">Paiements</a>
              <a href="/livraisons" className="hover:text-white transition-colors">Livraisons</a>
              <a href="/retours" className="hover:text-white transition-colors">Retours</a>
            </div>
          </div>
          <p className="text-white/15 text-[11px] text-center">
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
            setDashboardTab('overview')
          }
        }}
        product={shareModalProduct}
        commissionPct={shareModalCommission}
        shareLink={shareModalLink}
      />

      {/* ── Auth Modal ── */}
      {typeof document !== 'undefined' && createPortal(
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
              <AuthScreen isModal={true} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}


      </div>
    </div>
  )
}
