'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  Users,
  Share2,
  Eye,
  Flame,
  Plus,
  Link2,
  BarChart3,
  TrendingUp,
  LogIn,
  ShoppingBag,
  Zap,
  ArrowRight,
  CheckCircle2,
  Circle,
  Target,
  Sparkles,
  Coins,
  MousePointerClick,
} from 'lucide-react'
import { useAppStore, formatPrice, getLevelName, getLevelColor } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { UserRole, Order, Product } from '@/lib/store'

interface StatCard {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  bgColor: string
  gradientFrom: string
  gradientTo: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

const statusDotColors: Record<string, string> = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-blue-400',
  delivered: 'bg-emerald-400',
  cancelled: 'bg-red-400',
}

// Mock daily quest data for preview
const previewQuests = [
  { name: 'Connexion Quotidienne', progress: 1, threshold: 1, completed: true, icon: LogIn },
  { name: 'Première Vente', progress: 0, threshold: 1, completed: false, icon: ShoppingBag },
  { name: "3 Ventes Aujourd'hui", progress: 1, threshold: 3, completed: false, icon: Package },
]

function CountUpNumber({ target, duration = 1000 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const startValue = 0

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(startValue + (target - startValue) * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [target, duration])

  return <>{current}</>
}

// Circular progress ring for XP
function XPRing({ progress, level, size = 80 }: { progress: number; level: number; size?: number }) {
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const [animatedOffset, setAnimatedOffset] = useState(circumference)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedOffset(circumference - (progress / 100) * circumference)
    }, 200)
    return () => clearTimeout(timer)
  }, [progress, circumference])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(0.2 0.03 280)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#xpGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold gradient-text-warm">{level}</span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-wider">Niveau</span>
      </div>
    </div>
  )
}

export function OverviewTab() {
  const { user, products, orders, recommenderProducts, gamificationData, setDashboardTab, setProducts, setOrders, setRecommenderProducts, setGamificationData, token } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)

  const userRole = user?.role as UserRole
  const userId = user?.id

  const fetchData = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      if (userRole === 'owner') {
        const [productsRes, ordersRes] = await Promise.all([
          fetch(`/api/products?ownerId=${userId}`, { headers }),
          fetch(`/api/orders?ownerId=${userId}`, { headers }),
        ])
        if (productsRes.ok) {
          const data = await productsRes.json()
          setProducts(data.products || data || [])
        }
        if (ordersRes.ok) {
          const data = await ordersRes.json()
          setOrders(data.orders || data || [])
        }
      } else if (userRole === 'recommender') {
        const [recRes, ordersRes] = await Promise.all([
          fetch(`/api/recommender?userId=${userId}`, { headers }),
          fetch(`/api/orders?recommenderId=${userId}`, { headers }),
        ])
        if (recRes.ok) {
          const data = await recRes.json()
          setRecommenderProducts(data.recommenderProducts || data.products || data || [])
        }
        if (ordersRes.ok) {
          const data = await ordersRes.json()
          setOrders(data.orders || data || [])
        }
      } else if (userRole === 'ambassador') {
        const ordersRes = await fetch(`/api/orders?ownerId=${userId}`, { headers })
        if (ordersRes.ok) {
          const data = await ordersRes.json()
          setOrders(data.orders || data || [])
        }
      }

      const gamRes = await fetch(`/api/gamification?userId=${userId}`, { headers })
      if (gamRes.ok) {
        const data = await gamRes.json()
        setGamificationData(data)
      }
    } catch (error) {
      console.error('Failed to fetch overview data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, userRole, token, setProducts, setOrders, setRecommenderProducts, setGamificationData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStats = (): StatCard[] => {
    if (userRole === 'owner') {
      const totalProducts = products.length
      const pendingOrders = orders.filter((o) => o.status === 'pending').length
      const deliveredOrders = orders.filter((o) => o.status === 'delivered').length
      const totalRevenue = orders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + o.finalPrice, 0)

      return [
        { label: 'Total Produits', value: totalProducts, icon: Package, color: 'text-orange-400', bgColor: 'bg-orange-500/15', gradientFrom: 'from-orange-500', gradientTo: 'to-amber-500' },
        { label: 'Commandes en attente', value: pendingOrders, icon: ShoppingCart, color: 'text-yellow-400', bgColor: 'bg-yellow-500/15', gradientFrom: 'from-yellow-500', gradientTo: 'to-orange-500' },
        { label: 'Ventes livrées', value: deliveredOrders, icon: Truck, color: 'text-emerald-400', bgColor: 'bg-emerald-500/15', gradientFrom: 'from-emerald-500', gradientTo: 'to-teal-500' },
        { label: 'Revenus total', value: formatPrice(totalRevenue), icon: DollarSign, color: 'text-purple-400', bgColor: 'bg-purple-500/15', gradientFrom: 'from-purple-500', gradientTo: 'to-pink-500' },
      ]
    } else if (userRole === 'ambassador') {
      const recProducts = recommenderProducts.length
      const networkSales = orders.filter((o) => o.status === 'delivered').length
      const commissions = orders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + o.commissionAmbassador, 0)
      const streak = user?.streak ?? 0

      return [
        { label: 'Recommandeurs', value: recProducts, icon: Users, color: 'text-purple-400', bgColor: 'bg-purple-500/15', gradientFrom: 'from-purple-500', gradientTo: 'to-violet-500' },
        { label: 'Ventes réseau', value: networkSales, icon: TrendingUp, color: 'text-orange-400', bgColor: 'bg-orange-500/15', gradientFrom: 'from-orange-500', gradientTo: 'to-red-500' },
        { label: 'Commissions', value: formatPrice(commissions), icon: DollarSign, color: 'text-emerald-400', bgColor: 'bg-emerald-500/15', gradientFrom: 'from-emerald-500', gradientTo: 'to-cyan-500' },
        { label: 'Série active', value: `${streak} jours`, icon: Flame, color: 'text-red-400', bgColor: 'bg-red-500/15', gradientFrom: 'from-red-500', gradientTo: 'to-orange-500' },
      ]
    } else {
      const sharedProducts = recommenderProducts.length
      const totalVisits = recommenderProducts.reduce((sum, rp) => sum + rp.visits, 0)
      const totalOrders = orders.length
      const commissions = orders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + o.commissionRecommender, 0)
      const clickEarnings = user?.clickEarnings ?? 0

      return [
        { label: 'Produits partagés', value: sharedProducts, icon: Share2, color: 'text-orange-400', bgColor: 'bg-orange-500/15', gradientFrom: 'from-orange-500', gradientTo: 'to-amber-500' },
        { label: 'Gains Clics', value: formatPrice(clickEarnings), icon: MousePointerClick, color: 'text-emerald-400', bgColor: 'bg-emerald-500/15', gradientFrom: 'from-emerald-500', gradientTo: 'to-teal-500' },
        { label: 'Commandes', value: totalOrders, icon: ShoppingCart, color: 'text-purple-400', bgColor: 'bg-purple-500/15', gradientFrom: 'from-purple-500', gradientTo: 'to-pink-500' },
        { label: 'Commissions', value: formatPrice(commissions), icon: DollarSign, color: 'text-yellow-400', bgColor: 'bg-yellow-500/15', gradientFrom: 'from-yellow-500', gradientTo: 'to-orange-500' },
      ]
    }
  }

  const stats = getStats()
  const recentOrders = orders.slice(0, 5)
  const progress = gamificationData?.progress

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 w-full rounded-2xl bg-muted/30 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-xl p-4 h-28 animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-4 h-16 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Greeting Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="glass rounded-2xl p-5 sm:p-6 relative overflow-hidden"
      >
        {/* Decorative background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* XP Progress Ring */}
          <XPRing
            progress={progress?.levelProgress ?? ((user?.xp ?? 0) % 500) / 500 * 100}
            level={user?.level ?? 1}
            size={90}
          />

          <div className="flex-1 min-w-0">
            <motion.h1
              className="text-2xl sm:text-3xl font-bold mb-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {getGreeting()}, <span className="animated-gradient-text">{user?.name || 'Ami'}</span>
            </motion.h1>
            <motion.p
              className="text-muted-foreground text-sm mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Voici un aperçu de votre activité
            </motion.p>

            <div className="flex flex-wrap items-center gap-2">
              {/* Level badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${getLevelColor(user?.level ?? 1)} bg-clip-padding border border-white/10`}>
                <Sparkles className="w-3 h-3 text-white/90" />
                <span className="text-xs font-semibold text-white/95">
                  {getLevelName(user?.level ?? 1)}
                </span>
              </div>

              {/* XP count */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <Zap className="w-3 h-3 text-orange-400" />
                <span className="text-xs font-semibold text-orange-400">{user?.xp ?? 0} XP</span>
              </div>

              {/* Coins count */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400">{user?.coins ?? 0}</span>
              </div>

              {/* Streak */}
              {(user?.streak ?? 0) > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                  <Flame className="w-3 h-3 text-red-400 fire-flicker" />
                  <span className="text-xs font-semibold text-red-400">{user?.streak}j série</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* XP Progress bar */}
        <div className="relative mt-4">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{progress?.xpInCurrentLevel ?? (user?.xp ?? 0) % 500} XP</span>
            <span>{progress?.xpNeededForNextLevel ?? 500 - (user?.xp ?? 0) % 500} XP prochain niveau</span>
          </div>
          <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden progress-shine">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress?.levelProgress ?? ((user?.xp ?? 0) % 500) / 500 * 100}%` }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.5 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Animated Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="glass rounded-xl p-4 relative overflow-hidden group cursor-default"
            >
              {/* Gradient accent line at top */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradientFrom} ${stat.gradientTo}`} />

              {/* Hover glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradientFrom} ${stat.gradientTo} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`} />

              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold gradient-text">
                {typeof stat.value === 'number' ? (
                  <CountUpNumber target={stat.value} />
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-400" />
          Actions rapides
        </h2>
        <div className="flex flex-wrap gap-3">
          {userRole === 'owner' && (
            <>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setDashboardTab('products')}
                  className="bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 hover:from-orange-600 hover:via-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 border-0 relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nouveau Produit
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setDashboardTab('orders')}
                  variant="outline"
                  className="border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all"
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  Voir Commandes
                </Button>
              </motion.div>
            </>
          )}
          {userRole === 'recommender' && (
            <>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setDashboardTab('recommender')}
                  className="bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 hover:from-emerald-600 hover:via-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 border-0 relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  <Link2 className="w-4 h-4 mr-1.5" />
                  Partager un lien
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setDashboardTab('clicks')}
                  variant="outline"
                  className="border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all"
                >
                  <MousePointerClick className="w-4 h-4 mr-1.5" />
                  Mes Clics Rémunérés
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setDashboardTab('orders')}
                  variant="outline"
                  className="border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all"
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  Mes Commandes
                </Button>
              </motion.div>
            </>
          )}
          {userRole === 'ambassador' && (
            <>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setDashboardTab('ambassador')}
                  className="bg-gradient-to-r from-purple-500 via-purple-500 to-pink-500 hover:from-purple-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 border-0 relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  <Users className="w-4 h-4 mr-1.5" />
                  Mon Réseau
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setDashboardTab('orders')}
                  variant="outline"
                  className="border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all"
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  Voir Commandes
                </Button>
              </motion.div>
            </>
          )}
          <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setDashboardTab('leaderboard')}
              variant="outline"
              className="border-yellow-500/30 hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all"
            >
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Classement
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-orange-400" />
          Activité récente
        </h2>
        {recentOrders.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune commande récente</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentOrders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.06 }}
                whileHover={{ x: 4, backgroundColor: 'oklch(0.16 0.04 280 / 70%)' }}
                className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-colors cursor-default"
              >
                {/* Status dot indicator */}
                <div className="relative">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusDotColors[order.status] ?? 'bg-muted-foreground'}`} />
                  {(order.status === 'pending' || order.status === 'delivered') && (
                    <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${statusDotColors[order.status]} animate-ping opacity-30`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.miniSite?.product?.name ?? 'Produit'} · {formatPrice(order.finalPrice)}
                  </p>
                </div>
                <Badge className={`text-[10px] ${statusColors[order.status] ?? ''}`} variant="outline">
                  {statusLabels[order.status] ?? order.status}
                </Badge>
                <span className="text-[10px] text-muted-foreground hidden sm:block">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Daily Quest Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-400" />
            Quêtes du jour
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDashboardTab('gamification')}
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
          >
            Voir tout
            <ArrowRight className="w-3 h-3" />
          </motion.button>
        </div>

        <div className="space-y-2">
          {previewQuests.map((quest, i) => {
            const QuestIcon = quest.icon
            const questProgress = quest.threshold > 0 ? (quest.progress / quest.threshold) * 100 : 0
            return (
              <motion.div
                key={quest.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 + i * 0.08 }}
                className={`glass rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-all ${
                  quest.completed ? 'border-emerald-500/20' : ''
                }`}
              >
                {/* Quest icon / status */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  quest.completed
                    ? 'bg-emerald-500/20'
                    : 'bg-muted/50'
                }`}>
                  {quest.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <QuestIcon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-medium truncate ${quest.completed ? 'text-emerald-400' : ''}`}>
                      {quest.name}
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="relative h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        quest.completed
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-orange-500 to-pink-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${questProgress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 1 + i * 0.1 }}
                    />
                  </div>
                </div>

                {/* Progress text */}
                <span className={`text-xs font-medium shrink-0 ${
                  quest.completed ? 'text-emerald-400' : 'text-muted-foreground'
                }`}>
                  {quest.progress}/{quest.threshold}
                </span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
