'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MousePointerClick,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  Bot,
  BarChart3,
  ArrowRight,
  RefreshCw,
  Clock,
  Globe,
} from 'lucide-react'
import { useAppStore, formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { ClickStats } from '@/lib/store'

const deviceIcons: Record<string, React.ElementType> = {
  mobile: Smartphone,
  desktop: Monitor,
  tablet: Tablet,
  bot: Bot,
  unknown: Monitor,
}

const severityColors: Record<string, string> = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export function ClicksTab() {
  const { user, clickStats, setClickStats } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'history' | 'chart'>('overview')

  const userId = user?.id

  const fetchClickStats = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/clicks?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setClickStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch click stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, setClickStats])

  useEffect(() => {
    fetchClickStats()
  }, [fetchClickStats])

  if (isLoading || !clickStats) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-52 rounded-lg bg-muted/30 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-xl p-4 h-28 animate-pulse" />
          ))}
        </div>
        <div className="glass rounded-xl p-6 h-48 animate-pulse" />
      </div>
    )
  }

  const { user: clickUser, today, dailyEarnings, recentClicks, deviceBreakdown } = clickStats

  // Calculate chart data from dailyEarnings
  const chartDays = Object.entries(dailyEarnings)
    .sort(([a], [b]) => a.localeCompare(b))
    .reverse()
    .slice(0, 7)

  const maxEarnings = Math.max(...chartDays.map(([, d]) => d.earnings), 1)

  const totalDeviceClicks = deviceBreakdown.reduce((sum, d) => sum + d.count, 0)

  const fraudRate = clickUser.totalValidClicks + clickUser.totalFraudClicks > 0
    ? Math.round(clickUser.totalFraudClicks / (clickUser.totalValidClicks + clickUser.totalFraudClicks) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.h2
          className="text-xl font-bold gradient-text-warm flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <MousePointerClick className="w-6 h-6 text-emerald-400" />
          Rémunération au Clic
        </motion.h2>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchClickStats}
            className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Actualiser
          </Button>
        </motion.div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Gains Totaux',
            value: formatPrice(clickUser.clickEarnings),
            icon: DollarSign,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/15',
            gradientFrom: 'from-emerald-500',
            gradientTo: 'to-teal-500',
          },
          {
            label: "Clics Aujourd'hui",
            value: today.validClicks,
            icon: MousePointerClick,
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/15',
            gradientFrom: 'from-orange-500',
            gradientTo: 'to-amber-500',
          },
          {
            label: "Gains du Jour",
            value: formatPrice(today.earnings),
            icon: TrendingUp,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/15',
            gradientFrom: 'from-purple-500',
            gradientTo: 'to-pink-500',
          },
          {
            label: 'Taux Fraude',
            value: `${fraudRate}%`,
            icon: fraudRate > 20 ? ShieldAlert : ShieldCheck,
            color: fraudRate > 20 ? 'text-red-400' : 'text-blue-400',
            bgColor: fraudRate > 20 ? 'bg-red-500/15' : 'bg-blue-500/15',
            gradientFrom: fraudRate > 20 ? 'from-red-500' : 'from-blue-500',
            gradientTo: fraudRate > 20 ? 'to-orange-500' : 'to-cyan-500',
          },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="glass rounded-xl p-4 relative overflow-hidden group cursor-default"
            >
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradientFrom} ${stat.gradientTo}`} />
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradientFrom} ${stat.gradientTo} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`} />
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold gradient-text">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'overview' as const, label: 'Earnings 7j', icon: BarChart3 },
          { id: 'history' as const, label: 'Historique', icon: Clock },
          { id: 'chart' as const, label: 'Appareils', icon: Smartphone },
        ].map((tab) => {
          const isActive = activeSection === tab.id
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* 7-Day Earnings Chart */}
        {activeSection === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Gains des 7 derniers jours
            </h3>
            <div className="space-y-3">
              {chartDays.map(([date, data], i) => {
                const dayLabel = new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
                const barWidth = maxEarnings > 0 ? (data.earnings / maxEarnings) * 100 : 0
                return (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{dayLabel}</span>
                    <div className="flex-1 relative h-7 bg-muted/30 rounded-lg overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-emerald-500/60 to-teal-500/40"
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        <span className="text-xs font-medium">
                          {data.valid} clics
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          {formatPrice(data.earnings)}
                        </span>
                      </div>
                    </div>
                    {data.fraud > 0 && (
                      <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-400 border-red-500/20 shrink-0">
                        -{data.fraud} fraude
                      </Badge>
                    )}
                  </motion.div>
                )
              })}
            </div>
            {chartDays.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucune donnée de clic disponible
              </div>
            )}
          </motion.div>
        )}

        {/* Click History */}
        {activeSection === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              Historique des clics récents
            </h3>
            {recentClicks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <MousePointerClick className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                Aucun clic enregistré
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentClicks.map((click, i) => {
                  const DeviceIcon = deviceIcons[click.deviceType] || Monitor
                  return (
                    <motion.div
                      key={click.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        click.isFraud
                          ? 'bg-red-500/5 border border-red-500/10'
                          : 'bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Status indicator */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        click.isVerified
                          ? 'bg-emerald-500/15'
                          : 'bg-red-500/15'
                      }`}>
                        {click.isVerified ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                        )}
                      </div>

                      {/* Device + Browser */}
                      <div className="flex items-center gap-2 shrink-0">
                        <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground max-w-[60px] truncate">{click.browserName}</span>
                      </div>

                      {/* Country + Time */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{click.country}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">
                          {new Date(click.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Fraud score for suspicious */}
                      {click.fraudScore > 0 && !click.isFraud && (
                        <div className="text-[10px] text-yellow-500/60 shrink-0">
                          Score: {click.fraudScore}
                        </div>
                      )}

                      {/* Earnings */}
                      <span className={`text-sm font-bold shrink-0 ${
                        click.isVerified ? 'text-emerald-400' : 'text-red-400/60'
                      }`}>
                        {click.isVerified ? formatPrice(click.earnings) : 'Bloqué'}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Device Breakdown */}
        {activeSection === 'chart' && (
          <motion.div
            key="chart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-400" />
              Répartition par appareil
            </h3>
            {deviceBreakdown.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="space-y-3">
                {deviceBreakdown.map((device, i) => {
                  const DeviceIcon = deviceIcons[device.device] || Monitor
                  const pct = totalDeviceClicks > 0 ? Math.round(device.count / totalDeviceClicks * 100) : 0
                  return (
                    <motion.div
                      key={device.device}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">{device.device}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {device.count} clics ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + i * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Security Info */}
            <div className="mt-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-400 mb-1">Protection Anti-Fraude</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Chaque clic est vérifié par notre système de sécurité à multiples couches :
                    détection de bots, empreinte numérique, limitation de débit, analyse de vélocité
                    et détection des clics en double. Les clics frauduleux sont bloqués automatiquement.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
            <MousePointerClick className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold gradient-text-warm mb-1">Comment ça marche ?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Partagez vos liens de recommandation. Chaque fois qu&apos;un visiteur clique sur votre lien,
              vous gagnez des FCFA, même s&apos;il ne commande pas ! Notre système anti-fraude garantit
              que seuls les vrais clics sont rémunérés.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
