'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Search, RefreshCw, ExternalLink, Copy, Check,
  ShoppingCart, DollarSign, Users, Calendar, Link2, Image as ImageIcon,
} from 'lucide-react'
import { formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// ─── Types ──────────────────────────────────────────────────────────────────

interface MiniSiteImage {
  storageUrl: string
  position: number
}

interface MiniSiteProduct {
  id: string
  name: string
  basePrice: number
  images: MiniSiteImage[]
}

interface MiniSiteData {
  id: string
  slug: string
  createdAt: string
  product: MiniSiteProduct
  _count: {
    orders: number
    recommenderProducts: number
  }
  revenue: number
}

interface MiniSitesResponse {
  miniSites: MiniSiteData[]
  total: number
  page: number
  totalPages: number
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function MiniSiteCardSkeleton() {
  return (
    <div className="glass-card rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded bg-white/10" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 rounded bg-white/8" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-12 rounded-lg bg-white/5" />
          <div className="h-12 rounded-lg bg-white/5" />
          <div className="h-12 rounded-lg bg-white/5" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-8 flex-1 rounded-lg bg-white/8" />
          <div className="h-8 w-8 rounded-lg bg-white/8" />
        </div>
      </div>
    </div>
  )
}

// ─── Stats Pill ─────────────────────────────────────────────────────────────

function StatsPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className={`flex flex-col items-center gap-1 p-2 rounded-lg bg-white/[0.03] border border-white/5`}>
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className="text-xs font-bold">{value}</span>
      <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
    </div>
  )
}

// ─── Mini-Site Card ─────────────────────────────────────────────────────────

interface MiniSiteCardProps {
  miniSite: MiniSiteData
  index: number
  onCopy: (slug: string) => void
  copiedSlug: string | null
}

function MiniSiteCard({ miniSite, index, onCopy, copiedSlug }: MiniSiteCardProps) {
  const mainImage = miniSite.product.images?.[0]?.storageUrl
  const slugPath = `/s/${miniSite.slug}`
  const isCopied = copiedSlug === miniSite.slug

  const formattedDate = new Date(miniSite.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="glass-card rounded-xl overflow-hidden group"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-white/5">
        {mainImage ? (
          <img
            src={mainImage}
            alt={miniSite.product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-white/10" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Product name overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-semibold text-sm text-white line-clamp-1 drop-shadow-lg">
            {miniSite.product.name}
          </h3>
          <p className="text-xs text-white/70 mt-0.5">
            {formatPrice(miniSite.product.basePrice)}
          </p>
        </div>

        {/* Globe icon badge */}
        <div className="absolute top-3 left-3">
          <Badge className="text-[10px] bg-orange-500/20 text-orange-400 border-orange-500/40 backdrop-blur-md">
            <Globe className="w-2.5 h-2.5 mr-1" />
            Mini-site
          </Badge>
        </div>

        {/* Recommenders badge */}
        {miniSite._count.recommenderProducts > 0 && (
          <div className="absolute top-3 right-3">
            <Badge className="text-[10px] bg-purple-500/20 text-purple-400 border-purple-500/40 backdrop-blur-md">
              <Users className="w-2.5 h-2.5 mr-1" />
              {miniSite._count.recommenderProducts}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Slug display */}
        <div className="flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
          <a
            href={slugPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-pink-400 hover:text-pink-300 font-mono truncate transition-colors underline underline-offset-2 decoration-pink-400/30 hover:decoration-pink-300/50"
          >
            {slugPath}
          </a>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <StatsPill
            icon={ShoppingCart}
            label="Commandes"
            value={miniSite._count.orders}
            color="text-orange-400"
          />
          <StatsPill
            icon={DollarSign}
            label="Revenu"
            value={miniSite.revenue > 0 ? formatPrice(miniSite.revenue) : '0'}
            color="text-emerald-400"
          />
          <StatsPill
            icon={Users}
            label="Reco."
            value={miniSite._count.recommenderProducts}
            color="text-purple-400"
          />
        </div>

        {/* Created date */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Calendar className="w-3 h-3" />
          Créé le {formattedDate}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {/* View mini-site */}
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={slugPath}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-1 justify-center bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 text-orange-400 border border-orange-500/20 hover:border-orange-500/40 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Voir le site
          </motion.a>

          {/* Copy link */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onCopy(miniSite.slug)}
            className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
              isCopied
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-white/5 text-muted-foreground border-white/10 hover:text-foreground hover:border-white/20'
            }`}
            title="Copier le lien"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminMiniSites() {
  const [miniSites, setMiniSites] = useState<MiniSiteData[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  const limit = 12

  // ─── Fetch mini-sites ─────────────────────────────────────────────────

  const fetchMiniSites = useCallback(async (p: number, s: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        action: 'all-mini-sites',
        page: p.toString(),
        limit: limit.toString(),
      })
      if (s) params.set('search', s)

      const res = await fetch(`/api/admin?${params}`)
      if (res.ok) {
        const data: MiniSitesResponse = await res.json()
        setMiniSites(data.miniSites)
        setTotal(data.total)
        setPage(data.page)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des mini-sites:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMiniSites(page, search)
  }, [page, search, fetchMiniSites])

  // ─── Search with debounce ───────────────────────────────────────────────

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(timeout)
  }, [searchInput])

  // ─── Copy link ─────────────────────────────────────────────────────────

  const handleCopyLink = async (slug: string) => {
    const url = `${window.location.origin}/s/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedSlug(slug)
      setTimeout(() => setCopiedSlug(null), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedSlug(slug)
      setTimeout(() => setCopiedSlug(null), 2000)
    }
  }

  // ─── Refresh ────────────────────────────────────────────────────────────

  const handleRefresh = () => {
    fetchMiniSites(page, search)
  }

  // ─── Stats summary ─────────────────────────────────────────────────────

  const totalOrders = miniSites.reduce((acc, ms) => acc + ms._count.orders, 0)
  const totalRevenue = miniSites.reduce((acc, ms) => acc + ms.revenue, 0)
  const totalRecommenders = miniSites.reduce((acc, ms) => acc + ms._count.recommenderProducts, 0)

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.h2
          className="text-xl font-bold gradient-text-warm flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Globe className="w-6 h-6 text-orange-400" />
          Gestion des Mini-Sites
          {total > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              ({total})
            </span>
          )}
        </motion.h2>

        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Summary stats bar */}
      {!isLoading && miniSites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="glass rounded-xl p-3 sm:p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold">{totalOrders}</p>
                <p className="text-[10px] text-muted-foreground">Commandes</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-3 sm:p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold gradient-text">{formatPrice(totalRevenue)}</p>
                <p className="text-[10px] text-muted-foreground">Revenu total</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-3 sm:p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold">{totalRecommenders}</p>
                <p className="text-[10px] text-muted-foreground">Recommandeurs</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom de produit ou slug..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 h-10"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('')
                setSearch('')
                setPage(1)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              Effacer
            </button>
          )}
        </div>
      </motion.div>

      {/* Mini-Sites Grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <MiniSiteCardSkeleton key={i} />
            ))}
          </motion.div>
        ) : miniSites.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Globe className="w-8 h-8 text-orange-400/40" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun mini-site trouvé</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {search
                ? `Aucun mini-site ne correspond à "${search}"`
                : 'Aucun mini-site n\'a été créé pour le moment'}
            </p>
            {search && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
                onClick={() => {
                  setSearchInput('')
                  setSearch('')
                  setPage(1)
                }}
              >
                Réinitialiser la recherche
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {miniSites.map((miniSite, i) => (
                <MiniSiteCard
                  key={miniSite.id}
                  miniSite={miniSite}
                  index={i}
                  onCopy={handleCopyLink}
                  copiedSlug={copiedSlug}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          className="flex items-center justify-center gap-2 pt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border-white/10 hover:bg-white/5 text-sm"
          >
            Précédent
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .filter((p) => {
                if (p === 1 || p === totalPages) return true
                if (Math.abs(p - page) <= 1) return true
                return false
              })
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1]
                  if (p - prev > 1) acc.push('ellipsis')
                }
                acc.push(p)
                return acc
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-xs">
                    ...
                  </span>
                ) : (
                  <motion.button
                    key={item}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPage(item)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                      page === item
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {item}
                  </motion.button>
                )
              )}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="border-white/10 hover:bg-white/5 text-sm"
          >
            Suivant
          </Button>
        </motion.div>
      )}

      {/* Page info */}
      {total > 0 && (
        <div className="text-center text-xs text-muted-foreground">
          Page {page} sur {totalPages} · {total} mini-site{total > 1 ? 's' : ''} au total
        </div>
      )}
    </div>
  )
}
