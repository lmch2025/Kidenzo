'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Link2,
  Copy,
  Check,
  User,
  BarChart3,
} from 'lucide-react'
import { useAppStore, formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'

interface NetworkRecommender {
  id: string
  name: string | null
  phone: string
  totalSales: number
  totalCommissions: number
  totalOrders: number
}

interface AmbassadorStats {
  totalRecommenders: number
  totalSales: number
  totalCommissions: number
  totalOrders: number
  recentOrders: Array<{
    id: string
    customerName: string
    finalPrice: number
    status: string
    createdAt: string
  }>
}

export function AmbassadorTab() {
  const { user, token } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [recommenders, setRecommenders] = useState<NetworkRecommender[]>([])
  const [stats, setStats] = useState<AmbassadorStats | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const userId = user?.id

  const fetchData = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const [networkRes, statsRes] = await Promise.all([
        fetch(`/api/ambassador?userId=${userId}&action=network`, { headers }),
        fetch(`/api/ambassador?userId=${userId}&action=stats`, { headers }),
      ])

      if (networkRes.ok) {
        const networkData = await networkRes.json()
        setRecommenders(networkData.recommenders ?? networkData ?? [])
      }
      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
    } catch (error) {
      console.error('Failed to fetch ambassador data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCopyRecruitLink = async () => {
    const link = `${window.location.origin}/register?ref=${userId}`
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
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const maxSales = Math.max(...recommenders.map((r) => r.totalSales), 1)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-52 rounded-lg bg-muted/30 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
        <div className="glass rounded-xl p-4 h-32 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-4 h-16 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const overviewCards = [
    {
      label: 'Recommandeurs',
      value: stats?.totalRecommenders ?? recommenders.length,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/15',
    },
    {
      label: 'Ventes totales',
      value: stats?.totalSales ?? 0,
      icon: TrendingUp,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/15',
    },
    {
      label: 'Commissions',
      value: formatPrice(stats?.totalCommissions ?? 0),
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15',
    },
    {
      label: 'Commandes',
      value: stats?.totalOrders ?? 0,
      icon: ShoppingCart,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/15',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-xl font-bold gradient-text-warm flex items-center gap-2">
        <Users className="w-6 h-6 text-purple-400" />
        Mon Réseau
      </h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {overviewCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass rounded-xl p-4"
            >
              <div className={`w-9 h-9 rounded-lg ${card.bgColor} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${card.color}`} />
              </div>
              <div className="text-xl font-bold gradient-text">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Recruitment Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-4 border border-purple-500/20"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Link2 className="w-4 h-4 text-purple-400" />
            Lien de parrainage
          </h3>
          <Button
            size="sm"
            variant="outline"
            className="border-purple-500/30 hover:bg-purple-500/10 text-purple-400 h-7 text-xs"
            onClick={handleCopyRecruitLink}
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copier
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Partagez ce lien pour recruter de nouveaux recommandeurs dans votre réseau
        </p>
        <div className="mt-2 p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
          <code className="text-xs text-purple-400 break-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${userId}` : `/register?ref=${userId}`}
          </code>
        </div>
      </motion.div>

      {/* Performance Chart */}
      {recommenders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            Performance par recommandeur
          </h3>
          <div className="glass rounded-xl p-4 space-y-3">
            {recommenders.map((rec, i) => {
              const barWidth = maxSales > 0 ? (rec.totalSales / maxSales) * 100 : 0
              return (
                <div key={rec.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate max-w-[150px]">
                      {rec.name || rec.phone}
                    </span>
                    <span className="font-medium text-orange-400">
                      {rec.totalSales} ventes
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(barWidth, 2)}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-purple-400"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Recruiters List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          Mes recommandeurs
        </h3>
        {recommenders.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucun recommandeur dans votre réseau</p>
            <p className="text-xs text-muted-foreground mt-1">
              Partagez votre lien de parrainage pour recruter
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recommenders.map((rec, i) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.06 }}
                className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
              >
                {/* Avatar Placeholder */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-purple-400/50" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {rec.name || 'Anonyme'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rec.totalOrders} commandes · {rec.totalSales} ventes
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-400">
                    {formatPrice(rec.totalCommissions)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">commissions</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
