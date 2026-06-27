'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Search, RefreshCw, Phone, User, Package,
  ChevronDown, Calendar, DollarSign, Users, ArrowRight,
  Clock, CheckCircle2, XCircle, Truck, AlertCircle,
} from 'lucide-react'
import { formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// ─── Types ──────────────────────────────────────────────────────────────────

interface OrderRecommender {
  id: string
  name: string | null
  phone: string
}

interface AdminOrder {
  id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  customerMessage: string | null
  finalPrice: number
  commissionRecommender: number
  commissionAmbassador: number
  status: string
  product: string | null
  productImage: string | null
  productBasePrice: number | null
  recommender: OrderRecommender | null
  miniSiteId: string | null
  createdAt: string
  updatedAt: string
}

interface OrdersResponse {
  orders: AdminOrder[]
  total: number
  page: number
  totalPages: number
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'

// ─── Status Config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  pending: {
    label: 'En attente',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/15',
    borderColor: 'border-yellow-500/30',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmée',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
    icon: CheckCircle2,
  },
  delivered: {
    label: 'Livrée',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30',
    icon: Truck,
  },
  cancelled: {
    label: 'Annulée',
    color: 'text-red-400',
    bgColor: 'bg-red-500/15',
    borderColor: 'border-red-500/30',
    icon: XCircle,
  },
}

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending', label: 'En attente' },
  { id: 'confirmed', label: 'Confirmées' },
  { id: 'delivered', label: 'Livrées' },
  { id: 'cancelled', label: 'Annulées' },
]

// ─── Status Transition Helpers ──────────────────────────────────────────────

const STATUS_FLOW: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function OrderCardSkeleton() {
  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 animate-pulse space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="h-3 w-24 rounded bg-white/8" />
        </div>
        <div className="h-6 w-20 rounded-full bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 rounded-lg bg-white/5" />
        <div className="h-12 rounded-lg bg-white/5" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 flex-1 rounded-lg bg-white/8" />
        <div className="h-8 flex-1 rounded-lg bg-white/8" />
      </div>
    </div>
  )
}

// ─── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status]
  if (!config) {
    return (
      <Badge variant="outline" className="text-[10px] border-white/20 text-muted-foreground">
        {status}
      </Badge>
    )
  }
  const Icon = config.icon
  return (
    <Badge
      className={`text-[10px] font-semibold border backdrop-blur-md ${config.bgColor} ${config.color} ${config.borderColor}`}
    >
      <Icon className="w-2.5 h-2.5 mr-1" />
      {config.label}
    </Badge>
  )
}

// ─── Format Date ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

// ─── Order Card ─────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: AdminOrder
  index: number
  onStatusChange: (orderId: string, newStatus: string) => void
  isUpdating: string | null
}

function OrderCard({ order, index, onStatusChange, isUpdating }: OrderCardProps) {
  const [showActions, setShowActions] = useState(false)
  const config = STATUS_CONFIG[order.status]
  const StatusIcon = config?.icon ?? AlertCircle
  const availableTransitions = STATUS_FLOW[order.status] ?? []
  const isThisUpdating = isUpdating === order.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="glass-card rounded-xl overflow-hidden group"
    >
      {/* Top accent line based on status */}
      <div className={`h-0.5 bg-gradient-to-r ${
        order.status === 'pending' ? 'from-yellow-500 via-amber-500 to-yellow-500' :
        order.status === 'confirmed' ? 'from-blue-500 via-cyan-500 to-blue-500' :
        order.status === 'delivered' ? 'from-emerald-500 via-teal-500 to-emerald-500' :
        'from-red-500 via-pink-500 to-red-500'
      }`} />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Header: Order ID + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-xs font-mono text-muted-foreground truncate">
                #{order.id.slice(0, 8)}...
              </span>
            </div>
            <h3 className="text-sm font-semibold truncate group-hover:text-orange-400 transition-colors">
              {order.customerName}
            </h3>
          </div>
          <div className="shrink-0">
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Customer info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Client</p>
              <p className="text-xs font-medium truncate">{order.customerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <Phone className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Téléphone</p>
              <p className="text-xs font-medium truncate">{order.customerPhone}</p>
            </div>
          </div>
        </div>

        {/* Product & Price */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          {order.productImage ? (
            <img
              src={order.productImage}
              alt={order.product ?? 'Produit'}
              className="w-10 h-10 rounded-lg object-contain shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-emerald-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground">Produit</p>
            <p className="text-xs font-medium truncate">{order.product ?? 'Produit supprimé'}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-muted-foreground">Prix final</p>
            <p className="text-sm font-bold gradient-text">{formatPrice(order.finalPrice)}</p>
          </div>
        </div>

        {/* Commission details */}
        {(order.commissionRecommender > 0 || order.commissionAmbassador > 0) && (
          <div className="grid grid-cols-2 gap-2">
            {order.commissionRecommender > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <DollarSign className="w-3 h-3 text-orange-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-muted-foreground">Commission reco.</p>
                  <p className="text-xs font-semibold text-orange-400">{formatPrice(order.commissionRecommender)}</p>
                </div>
              </div>
            )}
            {order.commissionAmbassador > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <DollarSign className="w-3 h-3 text-purple-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-muted-foreground">Commission ambass.</p>
                  <p className="text-xs font-semibold text-purple-400">{formatPrice(order.commissionAmbassador)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommender info */}
        {order.recommender && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
            <Users className="w-3 h-3 text-cyan-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] text-muted-foreground">Recommandeur</p>
              <p className="text-xs font-medium text-cyan-400 truncate">
                {order.recommender.name ?? order.recommender.phone}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground shrink-0">{order.recommender.phone}</p>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {formatDate(order.createdAt)}
        </div>

        {/* Actions */}
        {availableTransitions.length > 0 && (
          <div className="pt-1 border-t border-white/5">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowActions(!showActions)}
              className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground py-1.5 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <StatusIcon className="w-3.5 h-3.5" />
                Changer le statut
              </span>
              <motion.div
                animate={{ rotate: showActions ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 pt-2">
                    {availableTransitions.map((nextStatus) => {
                      const nextConfig = STATUS_CONFIG[nextStatus]
                      if (!nextConfig) return null
                      const NextIcon = nextConfig.icon
                      return (
                        <motion.button
                          key={nextStatus}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => onStatusChange(order.id, nextStatus)}
                          disabled={isThisUpdating}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${nextConfig.bgColor} ${nextConfig.color} ${nextConfig.borderColor} hover:${nextConfig.bgColor.replace('/15', '/25')}`}
                        >
                          {isThisUpdating ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <NextIcon className="w-3 h-3" />
                          )}
                          Passer à {nextConfig.label}
                          <ArrowRight className="w-2.5 h-2.5 ml-0.5 opacity-50" />
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const limit = 10

  // ─── Fetch orders ─────────────────────────────────────────────────────

  const fetchOrders = useCallback(async (p: number, s: string, status: StatusFilter) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        action: 'all-orders',
        page: p.toString(),
        limit: limit.toString(),
      })
      if (s) params.set('search', s)
      if (status !== 'all') params.set('status', status)

      const res = await fetch(`/api/admin?${params}`)
      if (res.ok) {
        const data: OrdersResponse = await res.json()
        setOrders(data.orders)
        setTotal(data.total)
        setPage(data.page)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders(page, search, statusFilter)
  }, [page, search, statusFilter, fetchOrders])

  // ─── Search with debounce ────────────────────────────────────────────

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [searchInput])

  // ─── Update order status ─────────────────────────────────────────────

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-order-status', orderId, status: newStatus }),
      })
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: newStatus } : o
          )
        )
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  // ─── Refresh ─────────────────────────────────────────────────────────

  const handleRefresh = () => {
    fetchOrders(page, search, statusFilter)
  }

  // ─── Count by status (from current page data or total) ───────────────

  const statusCounts = STATUS_TABS.map((tab) => ({
    ...tab,
    count: tab.id === 'all' ? total : undefined,
  }))

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.h2
          className="text-xl font-bold gradient-text-warm flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ShoppingCart className="w-6 h-6 text-orange-400" />
          Gestion des Commandes
          {total > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              ({total})
            </span>
          )}
        </motion.h2>

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

      {/* Search & Status Filter */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou téléphone..."
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

        {/* Status filter tabs */}
        <div className="flex gap-1 glass rounded-lg p-1 overflow-x-auto scrollbar-thin">
          {statusCounts.map((tab) => {
            const isActive = statusFilter === tab.id
            const config = tab.id !== 'all' ? STATUS_CONFIG[tab.id] : null
            const TabIcon = config?.icon ?? ShoppingCart
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setStatusFilter(tab.id)
                  setPage(1)
                }}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? config
                      ? `${config.bgColor} ${config.color} border ${config.borderColor}`
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                <TabIcon className="w-3 h-3" />
                {tab.label}
                {isActive && tab.count !== undefined && (
                  <span className="ml-0.5 text-[10px] opacity-70">({tab.count})</span>
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Orders List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </motion.div>
        ) : orders.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-orange-400/40" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune commande trouvée</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {search
                ? `Aucune commande ne correspond à "${search}"`
                : statusFilter !== 'all'
                  ? `Aucune commande ${STATUS_CONFIG[statusFilter]?.label?.toLowerCase() ?? statusFilter}`
                  : 'Les commandes apparaîtront ici lorsque des clients commanderont'}
            </p>
            {(search || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
                onClick={() => {
                  setSearchInput('')
                  setSearch('')
                  setStatusFilter('all')
                  setPage(1)
                }}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <AnimatePresence>
              {orders.map((order, i) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  index={i}
                  onStatusChange={handleStatusChange}
                  isUpdating={isUpdating}
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
          Page {page} sur {totalPages} · {total} commande{total > 1 ? 's' : ''} au total
        </div>
      )}
    </div>
  )
}
