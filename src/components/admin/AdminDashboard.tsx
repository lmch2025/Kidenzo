'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Package, ShoppingCart, DollarSign, Globe, TrendingUp,
  ArrowUpRight, ArrowDownRight, Clock, Star,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { formatPrice } from '@/lib/store'
import { Badge } from '@/components/ui/badge'

// ─── Types ──────────────────────────────────────────────────────────
interface DashboardData {
  totalUsers: number
  usersByRole: { owner: number; ambassador: number; recommender: number }
  totalProducts: number
  activeProducts: number
  totalOrders: number
  ordersByStatus: { pending: number; confirmed: number; delivered: number; cancelled: number }
  totalRevenue: number
  totalCommissions: number
  activeMiniSites: number
  recentOrders: Array<{
    id: string
    customerName: string
    finalPrice: number
    status: string
    createdAt: string
    miniSite?: { product?: { name?: string } }
    product?: string
  }>
  recentUsers: Array<{
    id: string
    name: string | null
    phone: string
    role: string
    createdAt: string
  }>
  revenueChart: Array<{ date: string; revenue: number; orders?: number }>
}

// ─── Status config ──────────────────────────────────────────────────
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

const pieColors: Record<string, string> = {
  pending: '#eab308',
  confirmed: '#3b82f6',
  delivered: '#10b981',
  cancelled: '#ef4444',
}

const roleLabels: Record<string, string> = {
  owner: 'Propriétaire',
  ambassador: 'Ambassadeur',
  recommender: 'Recommandeur',
}

// ─── Animated Counter ───────────────────────────────────────────────
function AnimatedCounter({ target, duration = 1200, prefix = '', suffix = '' }: {
  target: number
  duration?: number
  prefix?: string
  suffix?: string
}) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])

  return <>{prefix}{current.toLocaleString('fr-FR')}{suffix}</>
}

// ─── Skeleton Loader ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-4 sm:p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-white/5" />
        <div className="w-5 h-5 rounded bg-white/5" />
      </div>
      <div className="h-7 w-24 rounded bg-white/5 mb-2" />
      <div className="h-3 w-16 rounded bg-white/5" />
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="glass rounded-lg p-3 animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 rounded bg-white/5" />
            <div className="h-2.5 w-20 rounded bg-white/5" />
          </div>
          <div className="h-5 w-14 rounded bg-white/5" />
        </div>
      ))}
    </div>
  )
}

// ─── Custom Tooltip for Revenue Chart ───────────────────────────────
function RevenueTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 border border-white/10 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">
        {label ? new Date(label + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
      </p>
      <p className="text-sm font-bold gradient-text">
        {formatPrice(payload[0].value)}
      </p>
    </div>
  )
}

// ─── Metric Card ────────────────────────────────────────────────────
interface MetricCardProps {
  label: string
  value: number
  icon: React.ElementType
  gradient: string
  iconBg: string
  iconColor: string
  subtext?: string
  trend?: 'up' | 'down'
  delay?: number
  prefix?: string
  suffix?: string
}

function MetricCard({ label, value, icon: Icon, gradient, iconBg, iconColor, subtext, trend, delay = 0, prefix = '', suffix = '' }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.03, y: -4 }}
      className="glass rounded-xl p-4 sm:p-5 relative overflow-hidden group cursor-default"
    >
      {/* Gradient accent line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}`} />
      {/* Hover glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 rounded-xl`} />

      <div className="relative flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="text-xl sm:text-2xl font-bold gradient-text">
          <AnimatedCounter target={value} prefix={prefix} suffix={suffix} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {subtext && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">{subtext}</p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────
export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin?action=full-overview')
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const json = await res.json()

      // Map the API response to our DashboardData interface
      // The API returns nested objects, we flatten them for consistency
      const mapped: DashboardData = {
        totalUsers: json.users?.total ?? json.totalUsers ?? 0,
        usersByRole: {
          owner: json.users?.owners ?? json.usersByRole?.owner ?? 0,
          ambassador: json.users?.ambassadors ?? json.usersByRole?.ambassador ?? 0,
          recommender: json.users?.recommenders ?? json.usersByRole?.recommender ?? 0,
        },
        totalProducts: json.totalProducts ?? 0,
        activeProducts: json.activeProducts ?? 0,
        totalOrders: json.orders?.total ?? json.totalOrders ?? 0,
        ordersByStatus: {
          pending: json.orders?.pending ?? json.ordersByStatus?.pending ?? 0,
          confirmed: json.orders?.confirmed ?? json.ordersByStatus?.confirmed ?? 0,
          delivered: json.orders?.delivered ?? json.ordersByStatus?.delivered ?? 0,
          cancelled: json.orders?.cancelled ?? json.ordersByStatus?.cancelled ?? 0,
        },
        totalRevenue: json.totalRevenue ?? 0,
        totalCommissions: json.totalCommissions ?? 0,
        activeMiniSites: json.activeMiniSites ?? 0,
        recentOrders: (json.recentOrders ?? []).map((o: Record<string, unknown>) => ({
          id: o.id as string,
          customerName: o.customerName as string,
          finalPrice: o.finalPrice as number,
          status: o.status as string,
          createdAt: o.createdAt as string,
          miniSite: o.miniSite as { product?: { name?: string } } | undefined,
          product: o.product as string | undefined,
        })),
        recentUsers: json.recentUsers ?? [],
        revenueChart: (json.revenueChartData ?? json.revenueChart ?? []).map((d: Record<string, unknown>) => ({
          date: d.date as string,
          revenue: (d.revenue as number) ?? 0,
          orders: (d.orders as number) ?? 0,
        })),
      }

      setData(mapped)
    } catch (err) {
      console.error('Failed to fetch admin dashboard data:', err)
      setError('Impossible de charger les données du tableau de bord')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Pie chart data ──────────────────────────────────────────────
  const pieData = data
    ? [
        { name: 'En attente', value: data.ordersByStatus.pending, color: pieColors.pending },
        { name: 'Confirmées', value: data.ordersByStatus.confirmed, color: pieColors.confirmed },
        { name: 'Livrées', value: data.ordersByStatus.delivered, color: pieColors.delivered },
        { name: 'Annulées', value: data.ordersByStatus.cancelled, color: pieColors.cancelled },
      ].filter((d) => d.value > 0)
    : []

  // ─── Loading State ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="glass rounded-2xl p-5 sm:p-6 animate-pulse">
          <div className="h-8 w-64 rounded-lg bg-white/5 mb-2" />
          <div className="h-4 w-48 rounded bg-white/5" />
        </div>
        {/* Metric cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        {/* Chart skeleton */}
        <div className="glass rounded-xl p-5 animate-pulse">
          <div className="h-5 w-40 rounded bg-white/5 mb-4" />
          <div className="h-56 rounded bg-white/5" />
        </div>
        {/* Lists skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass rounded-xl p-5 animate-pulse">
            <div className="h-5 w-36 rounded bg-white/5 mb-4" />
            <SkeletonList />
          </div>
          <div className="glass rounded-xl p-5 animate-pulse">
            <div className="h-5 w-36 rounded bg-white/5 mb-4" />
            <SkeletonList />
          </div>
        </div>
      </div>
    )
  }

  // ─── Error State ─────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <ArrowDownRight className="w-6 h-6 text-red-400 rotate-180" />
        </div>
        <p className="text-muted-foreground mb-4">{error || 'Aucune donnée disponible'}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium"
        >
          Réessayer
        </motion.button>
      </div>
    )
  }

  // ─── Product name helper ─────────────────────────────────────────
  const getProductName = (order: DashboardData['recentOrders'][0]) => {
    return order.miniSite?.product?.name ?? order.product ?? 'Produit'
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="glass rounded-2xl p-5 sm:p-6 relative overflow-hidden"
      >
        {/* Decorative gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative">
          <motion.h1
            className="text-2xl sm:text-3xl font-bold mb-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="animated-gradient-text">Tableau de Bord Admin</span>
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Vue d&apos;ensemble de votre plateforme Kidenzo
          </motion.p>
          <motion.div
            className="flex items-center gap-2 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
              <Clock className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-medium text-orange-400">
                Mis à jour {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Star className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">En ligne</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ─── Metric Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          label="Total Utilisateurs"
          value={data.totalUsers}
          icon={Users}
          gradient="from-orange-500 to-amber-500"
          iconBg="bg-orange-500/15"
          iconColor="text-orange-400"
          subtext={`${data.usersByRole.owner} prop. · ${data.usersByRole.ambassador} ambass. · ${data.usersByRole.recommender} reco.`}
          trend="up"
          delay={0.1}
        />
        <MetricCard
          label="Total Produits"
          value={data.totalProducts}
          icon={Package}
          gradient="from-emerald-500 to-teal-500"
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
          subtext={data.activeProducts > 0 ? `${data.activeProducts} actifs` : undefined}
          trend="up"
          delay={0.15}
        />
        <MetricCard
          label="Total Commandes"
          value={data.totalOrders}
          icon={ShoppingCart}
          gradient="from-blue-500 to-cyan-500"
          iconBg="bg-blue-500/15"
          iconColor="text-blue-400"
          subtext={`${data.ordersByStatus.pending} en attente · ${data.ordersByStatus.delivered} livrées`}
          trend="up"
          delay={0.2}
        />
        <MetricCard
          label="Revenu Total"
          value={data.totalRevenue}
          icon={DollarSign}
          gradient="from-purple-500 to-pink-500"
          iconBg="bg-purple-500/15"
          iconColor="text-purple-400"
          prefix=""
          suffix=" FCFA"
          trend="up"
          delay={0.25}
        />
        <MetricCard
          label="Commissions Payées"
          value={data.totalCommissions}
          icon={TrendingUp}
          gradient="from-yellow-500 to-orange-500"
          iconBg="bg-yellow-500/15"
          iconColor="text-yellow-400"
          suffix=" FCFA"
          delay={0.3}
        />
        <MetricCard
          label="Mini-Sites Actifs"
          value={data.activeMiniSites}
          icon={Globe}
          gradient="from-pink-500 to-rose-500"
          iconBg="bg-pink-500/15"
          iconColor="text-pink-400"
          trend="up"
          delay={0.35}
        />
      </div>

      {/* ─── Revenue Chart ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="glass rounded-xl p-5 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            Revenus des 7 derniers jours
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500" />
            Revenus
          </div>
        </div>

        {data.revenueChart.length > 0 ? (
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#ec4899" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="50%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.03 280)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => new Date(v + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                  tick={{ fontSize: 10, fill: 'oklch(0.6 0.03 280)' }}
                  axisLine={{ stroke: 'oklch(0.25 0.03 280)' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
                  tick={{ fontSize: 10, fill: 'oklch(0.6 0.03 280)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="url(#lineGradient)"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  dot={{ r: 3, fill: '#f97316', stroke: '#1a1a2e', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#ec4899', stroke: '#1a1a2e', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center">
              <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              Aucune donnée de revenu disponible
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── Bottom Section: Charts + Lists ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* ─── Orders by Status Donut ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="glass rounded-xl p-5 relative overflow-hidden"
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-pink-400" />
            Commandes par statut
          </h3>

          {pieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="w-44 h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      animationBegin={400}
                      animationDuration={800}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold gradient-text">{data.totalOrders}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4 w-full">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-[11px] text-muted-foreground truncate">{entry.name}</span>
                    <span className="text-[11px] font-medium ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
              Aucune commande
            </div>
          )}
        </motion.div>

        {/* ─── Recent Orders ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="glass rounded-xl p-5 relative overflow-hidden"
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-orange-400" />
            Commandes récentes
          </h3>

          {data.recentOrders.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
              {data.recentOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.06 }}
                  whileHover={{ x: 3, backgroundColor: 'oklch(0.16 0.04 280 / 70%)' }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 transition-colors cursor-default"
                >
                  {/* Status indicator */}
                  <div className="relative shrink-0">
                    <div className={`w-2 h-2 rounded-full ${
                      order.status === 'pending' ? 'bg-yellow-400' :
                      order.status === 'confirmed' ? 'bg-blue-400' :
                      order.status === 'delivered' ? 'bg-emerald-400' :
                      'bg-red-400'
                    }`} />
                    {(order.status === 'pending' || order.status === 'delivered') && (
                      <div className={`absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-30 ${
                        order.status === 'pending' ? 'bg-yellow-400' : 'bg-emerald-400'
                      }`} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{order.customerName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {getProductName(order)} · {formatPrice(order.finalPrice)}
                    </p>
                  </div>

                  <Badge className={`text-[9px] shrink-0 ${statusColors[order.status] ?? ''}`} variant="outline">
                    {statusLabels[order.status] ?? order.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <ShoppingCart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                Aucune commande récente
              </div>
            </div>
          )}
        </motion.div>

        {/* ─── Recent Users ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="glass rounded-xl p-5 relative overflow-hidden"
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Utilisateurs récents
          </h3>

          {data.recentUsers.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
              {data.recentUsers.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.06 }}
                  whileHover={{ x: 3, backgroundColor: 'oklch(0.16 0.04 280 / 70%)' }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 transition-colors cursor-default"
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    user.role === 'owner'
                      ? 'bg-orange-500/20 text-orange-400'
                      : user.role === 'ambassador'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {(user.name || user.phone).charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{user.name || user.phone}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.phone}</p>
                  </div>

                  <Badge
                    className={`text-[9px] shrink-0 ${
                      user.role === 'owner'
                        ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                        : user.role === 'ambassador'
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}
                    variant="outline"
                  >
                    {roleLabels[user.role] ?? user.role}
                  </Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                Aucun utilisateur récent
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Users by Role Breakdown ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="glass rounded-xl p-5 relative overflow-hidden"
      >
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          Répartition des utilisateurs par rôle
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Owners */}
          <div className="relative rounded-xl p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/15 overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-bl-full" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">
                  <AnimatedCounter target={data.usersByRole.owner} />
                </div>
                <p className="text-xs text-muted-foreground">Propriétaires</p>
              </div>
            </div>
            {data.totalUsers > 0 && (
              <div className="mt-2 h-1.5 bg-orange-500/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.usersByRole.owner / data.totalUsers) * 100}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                />
              </div>
            )}
          </div>

          {/* Ambassadors */}
          <div className="relative rounded-xl p-4 bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/15 overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  <AnimatedCounter target={data.usersByRole.ambassador} />
                </div>
                <p className="text-xs text-muted-foreground">Ambassadeurs</p>
              </div>
            </div>
            {data.totalUsers > 0 && (
              <div className="mt-2 h-1.5 bg-purple-500/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.usersByRole.ambassador / data.totalUsers) * 100}%` }}
                  transition={{ duration: 1, delay: 0.9 }}
                />
              </div>
            )}
          </div>

          {/* Recommenders */}
          <div className="relative rounded-xl p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/15 overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">
                  <AnimatedCounter target={data.usersByRole.recommender} />
                </div>
                <p className="text-xs text-muted-foreground">Recommandeurs</p>
              </div>
            </div>
            {data.totalUsers > 0 && (
              <div className="mt-2 h-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.usersByRole.recommender / data.totalUsers) * 100}%` }}
                  transition={{ duration: 1, delay: 1.0 }}
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
