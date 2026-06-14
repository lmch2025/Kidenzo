'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Package,
  Phone,
  DollarSign,
} from 'lucide-react'
import { useAppStore, formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/lib/store'

type OrderFilter = 'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'

const FILTER_TABS: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending', label: 'En attente' },
  { id: 'confirmed', label: 'Confirmées' },
  { id: 'delivered', label: 'Livrées' },
  { id: 'cancelled', label: 'Annulées' },
]

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: {
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: Clock,
    label: 'En attente',
  },
  confirmed: {
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: CheckCircle2,
    label: 'Confirmée',
  },
  delivered: {
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: Truck,
    label: 'Livrée',
  },
  cancelled: {
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: XCircle,
    label: 'Annulée',
  },
}

export function OrdersTab() {
  const { user, orders, token, setOrders, updateOrderInList } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('all')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const userRole = user?.role as UserRole
  const userId = user?.id

  const fetchOrders = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const param = userRole === 'recommender' ? `recommenderId=${userId}` : `ownerId=${userId}`
      const res = await fetch(`/api/orders?${param}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, userRole, token, setOrders])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })
      if (res.ok) {
        const data = await res.json()
        updateOrderInList(data.order || data)
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const filteredOrders = activeFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === activeFilter)

  const orderCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-muted/30 animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-muted/30 animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-xl font-bold gradient-text-warm flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-orange-400" />
        Commandes
      </h2>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id
          const count = orderCounts[tab.id]
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'glass text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="orderFilterActive"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/15 to-purple-500/15 border border-orange-500/25"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
              {count > 0 && (
                <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-orange-500/20 text-orange-400' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-12 text-center"
        >
          <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune commande</h3>
          <p className="text-muted-foreground">
            {activeFilter === 'all'
              ? 'Les commandes apparaîtront ici'
              : `Aucune commande ${statusConfig[activeFilter]?.label?.toLowerCase() ?? ''}`}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order, i) => {
              const config = statusConfig[order.status] ?? statusConfig.pending
              const StatusIcon = config.icon

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-xl p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {order.customerName}
                        </h3>
                        <Badge className={`text-[10px] ${config.color}`} variant="outline">
                          <StatusIcon className="w-3 h-3 mr-0.5" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.customerPhone}
                        </span>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold gradient-text">
                        {formatPrice(order.finalPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Package className="w-3.5 h-3.5" />
                    <span>{order.miniSite?.product?.name ?? 'Produit'}</span>
                  </div>

                  {/* Commission Info */}
                  <div className="flex items-center gap-4 text-xs mb-3">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      Reco: <span className="text-emerald-400 font-medium">{formatPrice(order.commissionRecommender)}</span>
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-purple-400" />
                      Amba: <span className="text-purple-400 font-medium">{formatPrice(order.commissionAmbassador)}</span>
                    </span>
                  </div>

                  {/* Action Buttons (Owner only) */}
                  {userRole === 'owner' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white h-7 text-xs"
                            disabled={updatingStatus === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Confirmer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 text-xs"
                            disabled={updatingStatus === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          >
                            <XCircle className="w-3 h-3" />
                            Annuler
                          </Button>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white h-7 text-xs"
                            disabled={updatingStatus === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          >
                            <Truck className="w-3 h-3" />
                            Livrer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 text-xs"
                            disabled={updatingStatus === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          >
                            <XCircle className="w-3 h-3" />
                            Annuler
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
