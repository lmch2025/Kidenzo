'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Package,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Import,
  Link2,
  ImageIcon,
  Ruler,
  Weight,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  Camera,
} from 'lucide-react'
import { useAppStore, formatPrice, type ImportProductResult } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CATEGORIES = [
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

// USD to FCFA conversion rate (approximate)
const USD_TO_FCFA = 610

// Image compression utility
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        const MAX_SIZE = 1080
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width
          width = MAX_SIZE
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height
          height = MAX_SIZE
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          // Compress to webp, 80% quality
          const dataUrl = canvas.toDataURL('image/webp', 0.8)
          resolve(dataUrl.split(',')[1]) // Return only base64 string
        } else {
          reject(new Error('Canvas context null'))
        }
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function StockIndicator({ stock }: { stock: number }) {
  const color = stock > 10 ? 'bg-emerald-400' : stock > 0 ? 'bg-yellow-400' : 'bg-red-400'
  const label = stock > 10 ? 'En stock' : stock > 0 ? 'Stock faible' : 'Rupture'
  const textColor = stock > 10 ? 'text-emerald-400' : stock > 0 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="flex items-center gap-2">
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(stock, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${textColor} whitespace-nowrap`}>
        {stock} · {label}
      </span>
    </div>
  )
}

// Shimmer loading skeleton for import analysis
function ImportShimmerSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center"
        >
          <Sparkles className="w-4 h-4 text-white" />
        </motion.div>
        <div>
          <motion.p
            className="text-sm font-medium text-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Analyse en cours
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.5 }}
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}
            >
              .
            </motion.span>
          </motion.p>
          <p className="text-xs text-muted-foreground">Extraction des données produit...</p>
        </div>
      </div>

      {/* Shimmer lines */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-20 rounded bg-muted/50 shimmer" />
          <div
            className="h-9 w-full rounded-md bg-muted/30 shimmer"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        </div>
      ))}

      {/* Image gallery shimmer */}
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-muted/50 shimmer" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-16 h-16 rounded-lg bg-muted/30 shimmer"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProductsTab() {
  const { user, products, token, addProduct, updateProductInList, setProducts, triggerConfetti } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createStep, setCreateStep] = useState(1) // 1: Info & Photo, 2: Prix & Stock, 3: Commission
  const [creating, setCreating] = useState(false)
  const [generatingMiniSite, setGeneratingMiniSite] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null)

  // Form state (Create Dialog)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formCategory, setFormCategory] = useState('autre')
  const [formStock, setFormStock] = useState('')
  const [formMaxCommission, setFormMaxCommission] = useState('40')
  const [formCommissionPerClick, setFormCommissionPerClick] = useState('0')
  const [formImageFiles, setFormImageFiles] = useState<File[]>([])
  const [formImagePreviews, setFormImagePreviews] = useState<string[]>([])
  const [formImageUrls, setFormImageUrls] = useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  // Import state
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importedData, setImportedData] = useState<ImportProductResult | null>(null)
  const [importCreating, setImportCreating] = useState(false)

  // Import form state (editable after import)
  const [importFormName, setImportFormName] = useState('')
  const [importFormDesc, setImportFormDesc] = useState('')
  const [importFormPrice, setImportFormPrice] = useState('')
  const [importFormCategory, setImportFormCategory] = useState('autre')
  const [importFormStock, setImportFormStock] = useState('10')
  const [importFormMaxCommission, setImportFormMaxCommission] = useState('40')
  const [importSelectedImages, setImportSelectedImages] = useState<Set<number>>(new Set())

  const userId = user?.id

  const fetchProducts = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`/api/products?ownerId=${userId}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, token, setProducts])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts()
  }, [fetchProducts])

  const resetForm = () => {
    setCreateStep(1)
    setFormName('')
    setFormDesc('')
    setFormPrice('')
    setFormCategory('autre')
    setFormStock('')
    setFormMaxCommission('40')
    setFormCommissionPerClick('0')
    setFormImageFiles([])
    setFormImagePreviews([])
    setFormImageUrls([])
    setIsUploadingImages(false)
  }

  const resetImportForm = () => {
    setImportUrl('')
    setImportLoading(false)
    setImportError(null)
    setImportedData(null)
    setImportCreating(false)
    setImportFormName('')
    setImportFormDesc('')
    setImportFormPrice('')
    setImportFormCategory('autre')
    setImportFormStock('10')
    setImportFormMaxCommission('40')
    setImportSelectedImages(new Set())
  }

  const handleCreateProduct = async () => {
    if (!formName || !formPrice) return
    setCreating(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/products', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ownerId: userId,
          name: formName,
          description: formDesc || ' ', // Fallback if empty to avoid 400 error
          basePrice: parseFloat(formPrice),
          category: formCategory,
          stock: parseInt(formStock) || 0,
          maxCommission: parseInt(formMaxCommission) || 40,
          commissionPerClick: parseFloat(formCommissionPerClick) || 0,
          images: formImageUrls,
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        addProduct(data.product || data)
        setShowCreateDialog(false)
        resetForm()
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Failed to create product in API:', errorData)
        // Optionally show an error toast here
      }
    } catch (error) {
      console.error('Failed to create product:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleAnalyzeUrl = async () => {
    if (!importUrl.trim()) return
    setImportLoading(true)
    setImportError(null)
    setImportedData(null)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/import-product', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: importUrl.trim() }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
        throw new Error(errorData.error || 'Erreur lors de l\'analyse')
      }

      const data = await res.json()
      const product: ImportProductResult = data.product

      setImportedData(product)
      setImportFormName(product.name)
      setImportFormDesc(product.description)
      // Convert USD price to FCFA
      const fcfaPrice = Math.round(product.price * USD_TO_FCFA)
      setImportFormPrice(String(fcfaPrice))
      setImportFormCategory(product.category || 'autre')
      // Select all images by default
      setImportSelectedImages(new Set(product.images.map((_, i) => i)))
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Erreur lors de l\'analyse du lien')
    } finally {
      setImportLoading(false)
    }
  }

  const handleCreateImportedProduct = async () => {
    if (!importFormName || !importFormPrice) return
    setImportCreating(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      // Collect selected images
      const selectedImages = importedData
        ? importedData.images.filter((_, i) => importSelectedImages.has(i))
        : []

      const res = await fetch('/api/products', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ownerId: userId,
          name: importFormName,
          description: importFormDesc,
          basePrice: parseFloat(importFormPrice),
          category: importFormCategory,
          stock: parseInt(importFormStock) || 0,
          maxCommission: parseInt(importFormMaxCommission) || 40,
          weight: importedData?.weight || '',
          dimensions: importedData?.dimensions || '',
          sourceUrl: importedData?.sourceUrl || importUrl,
          images: selectedImages,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        addProduct(data.product || data)
        triggerConfetti()
        setShowImportDialog(false)
        resetImportForm()
      }
    } catch (error) {
      console.error('Failed to create imported product:', error)
    } finally {
      setImportCreating(false)
    }
  }

  const toggleImageSelection = (index: number) => {
    setImportSelectedImages(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleToggleStatus = async (product: typeof products[0]) => {
    setTogglingStatus(product.id)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const newStatus = product.status === 'active' ? 'inactive' : 'active'
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: product.id, status: newStatus }),
      })
      if (res.ok) {
        const data = await res.json()
        updateProductInList(data.product || data)
      }
    } catch (error) {
      console.error('Failed to toggle status:', error)
    } finally {
      setTogglingStatus(null)
    }
  }

  const handleGenerateMiniSite = async (productId: string) => {
    setGeneratingMiniSite(productId)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/mini-sites', {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId }),
      })
      if (res.ok) {
        const data = await res.json()
        const miniSite = data.miniSite || data
        // Update the product in list with mini-site
        const updatedProduct = products.find(p => p.id === productId)
        if (updatedProduct) {
          updateProductInList({ ...updatedProduct, miniSite })
        }
        triggerConfetti()
      }
    } catch (error) {
      console.error('Failed to generate mini-site:', error)
    } finally {
      setGeneratingMiniSite(null)
    }
  }

  const handleCopyLink = async (slug: string) => {
    const link = `${window.location.origin}/s/${slug}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedSlug(slug)
      setTimeout(() => setCopiedSlug(null), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedSlug(slug)
      setTimeout(() => setCopiedSlug(null), 2000)
    }
  }

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setImportUrl(text)
    } catch {
      // Clipboard API not available
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-40 rounded-lg bg-muted/30 animate-pulse" />
          <div className="h-9 w-36 rounded-lg bg-muted/30 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-4 h-56 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold gradient-text-warm flex items-center gap-2">
          <Package className="w-6 h-6 text-orange-400" />
          Mes Produits
        </h2>
        <div className="flex items-center gap-2">
          {/* Import Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => {
                resetImportForm()
                setShowImportDialog(true)
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20"
            >
              <Import className="w-4 h-4" />
              Importer
            </Button>
          </motion.div>
          {/* Create Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20 glow-orange"
            >
              <Plus className="w-4 h-4" />
              Nouveau Produit
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-12 text-center"
        >
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun produit</h3>
          <p className="text-muted-foreground mb-6">
            Commencez par importer un produit pour le vendre sur Kidenzo !
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button
              onClick={() => {
                resetImportForm()
                setShowImportDialog(true)
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
            >
              <Import className="w-4 h-4" />
              Importer un produit
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white"
            >
              <Plus className="w-4 h-4" />
              Créer un produit
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="glass rounded-xl overflow-hidden group"
              >
                {/* Image Placeholder */}
                <div className="h-36 bg-gradient-to-br from-orange-500/10 to-purple-500/10 flex items-center justify-center relative overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0].storageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-orange-400/30" />
                  )}
                  {product.status === 'inactive' && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">Inactif</span>
                    </div>
                  )}
                  {product.sourceUrl && (
                    <Badge className="absolute top-2 right-2 text-[9px] bg-emerald-500/80 text-white border-0">
                      <Import className="w-2.5 h-2.5 mr-0.5" />
                      Importé
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      <Badge
                        className={`text-[10px] mt-1 ${categoryColors[product.category] ?? categoryColors.autre}`}
                        variant="outline"
                      >
                        {CATEGORIES.find(c => c.value === product.category)?.label ?? product.category}
                      </Badge>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold gradient-text text-sm">
                        {formatPrice(product.basePrice)}
                      </p>
                    </div>
                  </div>

                  {/* Stock */}
                  <StockIndicator stock={product.stock} />

                  {/* Max Commission */}
                  <p className="text-xs text-muted-foreground">
                    Commission max: <span className="text-orange-400 font-medium">{product.maxCommission}%</span>
                  </p>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Statut</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {product.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                      <Switch
                        checked={product.status === 'active'}
                        disabled={togglingStatus === product.id}
                        onCheckedChange={() => handleToggleStatus(product)}
                      />
                    </div>
                  </div>

                  {/* Mini-Site */}
                  <div className="pt-2 border-t border-border/50">
                    {product.miniSite ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-orange-500/5 to-purple-500/5 border border-orange-500/20">
                          <Globe className="w-4 h-4 text-orange-400 shrink-0" />
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            /s/{product.miniSite.slug}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => window.open(`/s/${product.miniSite!.slug}`, '_blank')}
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleCopyLink(product.miniSite!.slug)}
                          >
                            {copiedSlug === product.miniSite.slug ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                        {copiedSlug === product.miniSite.slug && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[10px] text-emerald-400 text-center"
                          >
                            Lien copié !
                          </motion.p>
                        )}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
                        disabled={generatingMiniSite === product.id}
                        onClick={() => handleGenerateMiniSite(product.id)}
                      >
                        {generatingMiniSite === product.id ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Globe className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                        {generatingMiniSite === product.id ? 'Génération...' : 'Générer Mini-Site'}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ─────── Create Product Dialog (Wizard) ─────── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="glass-strong max-w-[95vw] w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="gradient-text-warm text-xl">Nouveau Produit</DialogTitle>
            <DialogDescription className="font-medium text-orange-400">
              {createStep === 1 && "Étape 1 sur 3 : Identité visuelle"}
              {createStep === 2 && "Étape 2 sur 3 : Détails de vente"}
              {createStep === 3 && "Étape 3 sur 3 : Rémunération"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 relative min-h-[350px]">
            {createStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Photos du produit (jusqu'à 5)</Label>
                  <div className="flex flex-col gap-2 w-full">
                    <label htmlFor="product-image" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 transition-colors relative overflow-hidden">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Camera className="w-8 h-8 text-orange-400 mb-2" />
                        <p className="text-sm text-muted-foreground font-medium">Appuyez pour ajouter des photos</p>
                      </div>
                      <input 
                        id="product-image" 
                        type="file" 
                        accept="image/*" 
                        multiple
                        className="hidden" 
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length > 0) {
                            // Append new files up to 5 max
                            const currentFileCount = formImageFiles.length
                            const newFilesToProcess = files.slice(0, 5 - currentFileCount)
                            if (newFilesToProcess.length === 0) return

                            const newFiles = [...formImageFiles, ...newFilesToProcess]
                            setFormImageFiles(newFiles)
                            setFormImagePreviews(newFiles.map(f => URL.createObjectURL(f)))

                            // Process and upload immediately
                            setIsUploadingImages(true)
                            try {
                              for (const file of newFilesToProcess) {
                                const base64String = await compressImage(file)
                                const uploadRes = await fetch('/api/upload-imgbb', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ image: base64String }),
                                })
                                if (uploadRes.ok) {
                                  const uploadData = await uploadRes.json()
                                  setFormImageUrls(prev => [...prev, uploadData.url])
                                }
                              }
                            } catch (err) {
                              console.error('Error uploading image', err)
                            } finally {
                              setIsUploadingImages(false)
                            }
                          }
                        }}
                      />
                    </label>
                    {formImagePreviews.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {formImagePreviews.map((preview, i) => (
                          <div key={i} className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              onClick={() => {
                                const newFiles = formImageFiles.filter((_, idx) => idx !== i)
                                const newUrls = formImageUrls.filter((_, idx) => idx !== i)
                                setFormImageFiles(newFiles)
                                setFormImagePreviews(newFiles.map(f => URL.createObjectURL(f)))
                                setFormImageUrls(newUrls)
                              }}
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nom du produit</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Chaussures de sport"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="bg-background/50 text-lg py-6"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Petite description</Label>
                  <Textarea
                    id="description"
                    placeholder="En quelques mots..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="bg-background/50 resize-none"
                    rows={2}
                  />
                </div>
              </motion.div>
            )}

            {createStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="price">Prix de vente (FCFA)</Label>
                  <div className="relative">
                    <Input
                      id="price"
                      type="number"
                      placeholder="5000"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="bg-background/50 text-xl py-8 pl-14 font-bold"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                      FCFA
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Quantité dispo</Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="100"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="bg-background/50 py-6"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={formCategory} onValueChange={setFormCategory}>
                      <SelectTrigger className="w-full bg-background/50 py-6">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {createStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <Label htmlFor="maxComm" className="text-sm font-medium">Commission par vente (%)</Label>
                    <div className="flex items-center justify-center gap-2">
                      <Input
                        id="maxComm"
                        type="number"
                        min="0"
                        max="100"
                        value={formMaxCommission}
                        onChange={(e) => setFormMaxCommission(e.target.value)}
                        className="bg-background/50 text-2xl py-6 text-center font-bold text-orange-400 border-orange-500/50 w-28"
                      />
                      <span className="text-xl font-bold text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-center">
                    <Label htmlFor="cpc" className="text-sm font-medium">Commission par clic (FCFA)</Label>
                    <div className="flex items-center justify-center gap-2">
                      <Input
                        id="cpc"
                        type="number"
                        min="0"
                        value={formCommissionPerClick}
                        onChange={(e) => setFormCommissionPerClick(e.target.value)}
                        className="bg-background/50 text-2xl py-6 text-center font-bold text-emerald-400 border-emerald-500/50 w-32"
                      />
                      <span className="text-xl font-bold text-muted-foreground">FCFA</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground px-4">
                      Payé au recommandeur et à l'application pour chaque clic valide (ex: 30% App, 70% Recommandeur).
                    </p>
                  </div>
                </div>

                {formPrice && formMaxCommission && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Prix de vente public :</span>
                      <span className="font-medium text-lg">{formatPrice(parseFloat(formPrice))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Part du recommandeur :</span>
                      <span className="font-bold text-lg text-orange-400">
                        {formatPrice(parseFloat(formPrice) * (parseFloat(formMaxCommission) / 100))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-orange-500/20">
                      <span className="text-sm font-medium">Votre bénéfice net :</span>
                      <span className="font-bold text-xl text-emerald-400">
                        {formatPrice(parseFloat(formPrice) - (parseFloat(formPrice) * (parseFloat(formMaxCommission) / 100)))}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <DialogFooter className="flex sm:justify-between items-center w-full gap-2 mt-4 flex-row justify-between">
            {createStep > 1 ? (
              <Button
                variant="outline"
                onClick={() => setCreateStep(createStep - 1)}
                disabled={creating}
                className="min-w-[100px]"
              >
                Précédent
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateDialog(false)
                  resetForm()
                }}
                disabled={creating}
              >
                Annuler
              </Button>
            )}

            {createStep < 3 ? (
              <Button
                onClick={() => setCreateStep(createStep + 1)}
                disabled={(createStep === 1 && !formName) || (createStep === 2 && !formPrice)}
                className="bg-primary text-primary-foreground min-w-[100px]"
              >
                Suivant
              </Button>
            ) : (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={handleCreateProduct}
                  disabled={!formName || !formPrice || creating || isUploadingImages}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white min-w-[120px]"
                >
                  {creating || isUploadingImages ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Package className="w-4 h-4 mr-2" />
                    </motion.div>
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {creating ? 'Création...' : isUploadingImages ? 'Upload...' : 'Terminer'}
                </Button>
              </motion.div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────── Import Product Dialog ─────── */}
      <Dialog open={showImportDialog} onOpenChange={(open) => {
        if (!open) resetImportForm()
        setShowImportDialog(open)
      }}>
        <DialogContent className="glass-strong !max-w-[calc(100vw-2rem)] sm:!max-w-lg max-h-[85vh] overflow-y-auto !p-3 sm:!p-6 !rounded-xl !gap-2 sm:!gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Importer un produit
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Collez un lien Alibaba ou AliExpress pour importer automatiquement les données
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* ── Step 1: URL Input ── */}
            {!importedData && !importLoading && (
              <motion.div
                key="url-input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 py-1 min-w-0 overflow-hidden"
              >
                <div className="space-y-2">
                  <Label htmlFor="import-url" className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <Link2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Lien du produit
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Input
                        id="import-url"
                        placeholder="https://www.alibaba.com/..."
                        value={importUrl}
                        onChange={(e) => {
                          setImportUrl(e.target.value)
                          setImportError(null)
                        }}
                        className="bg-background/50 pr-10 border-emerald-500/30 focus:border-emerald-500/60 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && importUrl.trim()) {
                            handleAnalyzeUrl()
                          }
                        }}
                      />
                      {importUrl && (
                        <button
                          onClick={() => setImportUrl('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handlePaste}
                      className="shrink-0 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
                      title="Coller depuis le presse-papier"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                    Supporte les liens Alibaba, AliExpress et 1688.com
                  </p>
                </div>

                {/* Error state */}
                <AnimatePresence>
                  {importError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-400 min-w-0">{importError}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAnalyzeUrl}
                        className="h-7 text-xs border-red-500/30 hover:bg-red-500/10 text-red-400"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Réessayer
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Supported platforms hint */}
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/20">
                  <div className="flex -space-x-1 shrink-0">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-[7px] sm:text-[8px] text-white font-bold border-2 border-background">
                      A
                    </div>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-[7px] sm:text-[8px] text-white font-bold border-2 border-background">
                      AE
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground flex-1 min-w-0">
                    Les données seront extraites automatiquement : nom, prix, description, images
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Loading / Analysis ── */}
            {importLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ImportShimmerSkeleton />
              </motion.div>
            )}

            {/* ── Step 3: Imported Data Preview ── */}
            {importedData && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 py-1 min-w-0 overflow-hidden"
              >
                {/* Success indicator */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
                  >
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                  </motion.div>
                  <p className="text-[10px] sm:text-xs text-emerald-400 font-medium min-w-0">
                    Analysé avec succès ! Vérifiez et modifiez les infos ci-dessous.
                  </p>
                </motion.div>

                {/* Product Name */}
                <div className="space-y-1">
                  <Label htmlFor="import-name" className="text-xs">Nom du produit</Label>
                  <Input
                    id="import-name"
                    value={importFormName}
                    onChange={(e) => setImportFormName(e.target.value)}
                    className="bg-background/50 text-sm h-9"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <Label htmlFor="import-desc" className="text-xs">Description</Label>
                  <Textarea
                    id="import-desc"
                    value={importFormDesc}
                    onChange={(e) => setImportFormDesc(e.target.value)}
                    className="bg-background/50 resize-none text-sm"
                    rows={2}
                  />
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <Label htmlFor="import-price" className="text-xs">Prix (FCFA)</Label>
                  <Input
                    id="import-price"
                    type="number"
                    value={importFormPrice}
                    onChange={(e) => setImportFormPrice(e.target.value)}
                    className="bg-background/50 text-sm h-9"
                  />
                  {importedData.price > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      <span className="text-emerald-400">≈ {importedData.price} USD</span>
                      {' '}· 1 USD ≈ {USD_TO_FCFA} FCFA
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <Label className="text-xs">Catégorie</Label>
                  <Select value={importFormCategory} onValueChange={setImportFormCategory}>
                    <SelectTrigger className="w-full bg-background/50 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock + Commission */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="import-stock" className="text-xs">Stock</Label>
                    <Input
                      id="import-stock"
                      type="number"
                      value={importFormStock}
                      onChange={(e) => setImportFormStock(e.target.value)}
                      className="bg-background/50 text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="import-maxcomm" className="text-xs">Commission (%)</Label>
                    <Input
                      id="import-maxcomm"
                      type="number"
                      min="0"
                      max="100"
                      value={importFormMaxCommission}
                      onChange={(e) => setImportFormMaxCommission(e.target.value)}
                      className="bg-background/50 text-sm h-9"
                    />
                  </div>
                </div>

                {/* Image Gallery */}
                {importedData.images.length > 0 && (
                  <div className="space-y-1.5 min-w-0 overflow-hidden">
                    <Label className="text-xs flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Images ({importSelectedImages.size}/{importedData.images.length})</span>
                    </Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto">
                      {importedData.images.map((imgUrl, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`relative group rounded-md overflow-hidden border-2 cursor-pointer aspect-square transition-all duration-200 ${
                            importSelectedImages.has(idx)
                              ? 'border-emerald-500 shadow-sm shadow-emerald-500/20'
                              : 'border-border/50 opacity-50 hover:opacity-80'
                          }`}
                          onClick={() => toggleImageSelection(idx)}
                        >
                          <img
                            src={imgUrl}
                            alt={`Image ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className={`absolute inset-0 flex items-center justify-center transition-colors ${
                            importSelectedImages.has(idx)
                              ? 'bg-emerald-500/20'
                              : 'bg-background/40'
                          }`}>
                            <Checkbox
                              checked={importSelectedImages.has(idx)}
                              className="pointer-events-none"
                            />
                          </div>
                          {idx === 0 && importSelectedImages.has(idx) && (
                            <Badge className="absolute top-0 left-0 text-[7px] px-0.5 py-0 bg-emerald-500 text-white border-0 rounded-none rounded-br-md">
                              1ère
                            </Badge>
                          )}
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
                        onClick={() => setImportSelectedImages(new Set(importedData.images.map((_, i) => i)))}
                      >
                        Tout sélectionner
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] border-border/50 hover:bg-muted/50"
                        onClick={() => setImportSelectedImages(new Set())}
                      >
                        Tout désélectionner
                      </Button>
                    </div>
                  </div>
                )}

                {/* Weight & Dimensions (read-only) */}
                {(importedData.weight || importedData.dimensions) && (
                  <div className="grid grid-cols-2 gap-2">
                    {importedData.weight && (
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30 border border-border/30 min-w-0">
                        <Weight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[9px] text-muted-foreground">Poids</p>
                          <p className="text-[11px] font-medium truncate">{importedData.weight}</p>
                        </div>
                      </div>
                    )}
                    {importedData.dimensions && (
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30 border border-border/30 min-w-0">
                        <Ruler className="w-3 h-3 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[9px] text-muted-foreground">Dimensions</p>
                          <p className="text-[11px] font-medium truncate">{importedData.dimensions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Source URL (read-only) */}
                {importedData.sourceUrl && (
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30 border border-border/30 min-w-0">
                    <Link2 className="w-3 h-3 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-muted-foreground">Source</p>
                      <p className="text-[11px] truncate">{importedData.sourceUrl}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="!flex-col gap-2 sm:!flex-row mt-1 sm:mt-2">
            {!importedData && !importLoading && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportDialog(false)
                    resetImportForm()
                  }}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAnalyzeUrl}
                  disabled={!importUrl.trim()}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white w-full sm:w-auto order-1 sm:order-2"
                >
                  <Link2 className="w-4 h-4" />
                  Analyser le lien
                </Button>
              </>
            )}

            {importLoading && (
              <Button
                variant="outline"
                onClick={() => {
                  setImportLoading(false)
                  setImportError(null)
                }}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
            )}

            {importedData && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setImportedData(null)
                    setImportError(null)
                  }}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Nouvelle analyse
                </Button>
                <Button
                  onClick={handleCreateImportedProduct}
                  disabled={!importFormName || !importFormPrice || importCreating}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white w-full sm:w-auto order-1 sm:order-2"
                >
                  {importCreating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Package className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {importCreating ? 'Création...' : 'Créer le produit'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
