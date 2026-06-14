'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Settings,
  AlertTriangle,
  DollarSign,
  MousePointerClick,
  Users,
  CheckCircle2,
  Save,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Activity,
  TrendingUp,
  Clock,
  Zap,
  Ban,
  Fingerprint,
  Timer,
  Lock,
  Globe,
  Eye,
  Trash2,
  Trophy,
  Filter,
  BarChart3,
} from 'lucide-react'
import { useAppStore, formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { PPCConfig, SuspiciousActivityData } from '@/lib/store'

// ─── Types ──────────────────────────────────────────────────────────
type SubTab = 'config' | 'alertes' | 'audit'

interface ClickAuditItem {
  id: string
  recommender: { id: string; name: string | null; phone: string; role: string }
  miniSiteId: string
  visitorIp: string
  visitorFingerprint: string
  userAgent: string
  isVerified: boolean
  isFraud: boolean
  fraudScore: number
  fraudReasons: string
  earnings: number
  deviceType: string | null
  browserName: string | null
  country: string | null
  createdAt: string
}

// ─── Severity colors ────────────────────────────────────────────────
const severityColors: Record<string, string> = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const severityLabels: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  critical: 'Critique',
}

const activityTypeIcons: Record<string, React.ElementType> = {
  velocity: Activity,
  duplicate_ip: ShieldAlert,
  duplicate_fingerprint: Fingerprint,
  bot: Ban,
  proxy: Globe,
  anomaly: AlertTriangle,
  unknown: ShieldAlert,
}

const activityTypeLabels: Record<string, string> = {
  velocity: 'Vélocité',
  duplicate_ip: 'IP dupliquée',
  duplicate_fingerprint: 'Empreinte dupliquée',
  bot: 'Robot détecté',
  proxy: 'Proxy/VPN',
  anomaly: 'Anomalie',
  unknown: 'Inconnu',
}

// ─── Sub-tab definitions ────────────────────────────────────────────
const subTabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: 'config', label: 'Configuration', icon: Settings },
  { id: 'alertes', label: 'Alertes', icon: AlertTriangle },
  { id: 'audit', label: 'Audit Clics', icon: BarChart3 },
]

// ─── Skeleton components ────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="glass rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-white/5" />
        <div className="h-3 w-20 rounded bg-white/5" />
      </div>
      <div className="h-7 w-16 rounded bg-white/5 mb-1" />
      <div className="h-2.5 w-12 rounded bg-white/5" />
    </div>
  )
}

function ConfigSkeleton() {
  return (
    <div className="glass rounded-xl p-5 sm:p-6 space-y-5 animate-pulse">
      <div className="h-5 w-48 rounded bg-white/5" />
      <div className="h-14 rounded-lg bg-white/[0.03]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-white/5" />
          <div className="h-10 rounded-lg bg-white/[0.03]" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-36 rounded bg-white/5" />
          <div className="h-10 rounded-lg bg-white/[0.03]" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-28 rounded bg-white/5" />
            <div className="h-10 rounded-lg bg-white/[0.03]" />
          </div>
        ))}
      </div>
      <div className="h-14 rounded-lg bg-white/[0.03]" />
      <div className="h-11 rounded-lg bg-white/[0.03]" />
    </div>
  )
}

function AlertSkeleton() {
  return (
    <div className="glass rounded-xl p-5 space-y-3 animate-pulse">
      <div className="h-5 w-36 rounded bg-white/5" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 rounded-lg bg-white/[0.03]" />
      ))}
    </div>
  )
}

function AuditSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-xl p-4">
            <div className="h-3 w-20 rounded bg-white/5 mb-2" />
            <div className="h-7 w-16 rounded bg-white/5" />
          </div>
        ))}
      </div>
      <div className="glass rounded-xl p-5 space-y-2">
        <div className="h-5 w-44 rounded bg-white/5 mb-3" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-white/[0.03]" />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────
export function AdminPPC() {
  const { user, ppcConfig, setPPCConfig } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('config')

  // Data state
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivityData[]>([])
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [overviewData, setOverviewData] = useState<{
    today: { totalClicks: number; validClicks: number; fraudClicks: number; fraudRate: number; totalEarnings: number }
    suspicious: { total: number; critical: number }
    topRecommenders: Array<{
      id: string; name: string | null; phone: string; clickEarnings: number; totalValidClicks: number; totalFraudClicks: number
    }>
  } | null>(null)
  const [clickAuditData, setClickAuditData] = useState<{
    clicks: ClickAuditItem[]
    total: number
    page: number
    totalPages: number
  } | null>(null)
  const [auditFilter, setAuditFilter] = useState<'all' | 'fraud' | 'valid'>('all')
  const [auditPage, setAuditPage] = useState(1)

  // Local form state
  const [formConfig, setFormConfig] = useState<PPCConfig | null>(null)

  // Rejecting state
  const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set())
  const [selectedClickIds, setSelectedClickIds] = useState<Set<string>>(new Set())

  // ─── Fetch all data ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [configRes, overviewRes, suspiciousRes] = await Promise.all([
        fetch('/api/admin?action=ppc-config'),
        fetch('/api/admin?action=overview'),
        fetch('/api/admin?action=suspicious&limit=50'),
      ])

      if (configRes.ok) {
        const data = await configRes.json()
        setPPCConfig(data.config)
        setFormConfig(data.config)
      }

      if (overviewRes.ok) {
        const data = await overviewRes.json()
        setOverviewData(data)
      }

      if (suspiciousRes.ok) {
        const data = await suspiciousRes.json()
        setSuspiciousActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données PPC:', error)
    } finally {
      setIsLoading(false)
    }
  }, [setPPCConfig])

  // ─── Fetch click audit ─────────────────────────────────────────────
  const fetchClickAudit = useCallback(async (page: number, filter: string) => {
    try {
      const res = await fetch(`/api/admin?action=click-audit&page=${page}&limit=20&filter=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setClickAuditData(data)
      }
    } catch (error) {
      console.error('Erreur audit clics:', error)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (activeSubTab === 'audit') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchClickAudit(auditPage, auditFilter)
    }
  }, [activeSubTab, auditPage, auditFilter, fetchClickAudit])

  // ─── Save config ───────────────────────────────────────────────────
  const handleSaveConfig = async () => {
    if (!formConfig) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-ppc', ...formConfig }),
      })
      if (res.ok) {
        const data = await res.json()
        setPPCConfig(data.config)
        setFormConfig(data.config)
      }
    } catch (error) {
      console.error('Erreur sauvegarde config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Resolve activity ──────────────────────────────────────────────
  const handleResolveActivity = async (activityId: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve-suspicious', activityId, resolvedBy: user?.id }),
      })
      if (res.ok) {
        setSuspiciousActivities((prev) => prev.filter((a) => a.id !== activityId))
      }
    } catch (error) {
      console.error('Erreur résolution activité:', error)
    }
  }

  // ─── Reject fraud clicks ───────────────────────────────────────────
  const handleRejectClicks = async (recommenderId: string, clickIds?: string[]) => {
    const key = recommenderId
    setRejectingIds((prev) => new Set(prev).add(key))
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject-clicks', recommenderId, clickIds }),
      })
      if (res.ok) {
        setSelectedClickIds(new Set())
        fetchClickAudit(auditPage, auditFilter)
        fetchData() // Refresh overview
      }
    } catch (error) {
      console.error('Erreur rejet clics:', error)
    } finally {
      setRejectingIds((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  // ─── Toggle click selection ────────────────────────────────────────
  const toggleClickSelection = (clickId: string) => {
    setSelectedClickIds((prev) => {
      const next = new Set(prev)
      if (next.has(clickId)) next.delete(clickId)
      else next.add(clickId)
      return next
    })
  }

  // ─── Filtered suspicious activities ────────────────────────────────
  const filteredActivities = severityFilter === 'all'
    ? suspiciousActivities
    : suspiciousActivities.filter((a) => a.severity === severityFilter)

  // ─── Loading state ─────────────────────────────────────────────────
  if (isLoading || !formConfig) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="glass rounded-2xl p-5 sm:p-6 animate-pulse">
          <div className="h-8 w-64 rounded-lg bg-white/5 mb-2" />
          <div className="h-4 w-48 rounded bg-white/5" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        {/* Tab skeleton */}
        <div className="flex gap-2">
          <div className="h-8 w-28 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-8 w-20 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-8 w-24 rounded-lg bg-white/5 animate-pulse" />
        </div>
        <ConfigSkeleton />
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ─── Header ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl p-5 sm:p-6 relative overflow-hidden"
      >
        {/* Decorative gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div>
            <motion.h2
              className="text-xl sm:text-2xl font-bold mb-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="animated-gradient-text">PPC & Anti-Fraude</span>
            </motion.h2>
            <motion.p
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Gestion de la rémunération au clic et protection anti-fraude
            </motion.p>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Actualiser
            </Button>
          </motion.div>
        </div>

        {/* Status badges */}
        <motion.div
          className="relative flex items-center gap-2 mt-3 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
            formConfig.active
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${formConfig.active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={`text-xs font-medium ${formConfig.active ? 'text-emerald-400' : 'text-red-400'}`}>
              {formConfig.active ? 'PPC Actif' : 'PPC Inactif'}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
            <MousePointerClick className="w-3 h-3 text-orange-400" />
            <span className="text-xs font-medium text-orange-400">{formConfig.ratePerClick} FCFA/clic</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <Shield className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400">Seuil fraude: {formConfig.fraudScoreThreshold}%</span>
          </div>
        </motion.div>
      </motion.div>

      {/* ─── Overview Stats ───────────────────────────────────────── */}
      {overviewData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Clics Aujourd\'hui', value: overviewData.today.totalClicks, icon: MousePointerClick, color: 'text-orange-400', bgColor: 'bg-orange-500/15', gradient: 'from-orange-500 to-amber-500' },
            { label: 'Clics Valides', value: overviewData.today.validClicks, icon: ShieldCheck, color: 'text-emerald-400', bgColor: 'bg-emerald-500/15', gradient: 'from-emerald-500 to-teal-500' },
            { label: 'Clics Fraude', value: overviewData.today.fraudClicks, icon: ShieldAlert, color: 'text-red-400', bgColor: 'bg-red-500/15', gradient: 'from-red-500 to-rose-500' },
            { label: 'Taux Fraude', value: `${overviewData.today.fraudRate}%`, icon: TrendingUp, color: 'text-yellow-400', bgColor: 'bg-yellow-500/15', gradient: 'from-yellow-500 to-orange-500' },
            { label: 'Dépenses Jour', value: formatPrice(overviewData.today.totalEarnings), icon: DollarSign, color: 'text-purple-400', bgColor: 'bg-purple-500/15', gradient: 'from-purple-500 to-pink-500' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 25, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.07, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ scale: 1.03, y: -3 }}
                className="glass rounded-xl p-4 relative overflow-hidden group cursor-default"
              >
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient}`} />
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 rounded-xl`} />
                <div className="relative flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-tight">{stat.label}</span>
                </div>
                <div className="relative text-xl font-bold">{stat.value}</div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ─── Sub-tab Navigation ───────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id
          const Icon = tab.icon
          const alertCount = tab.id === 'alertes' && overviewData ? overviewData.suspicious.total : 0
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSubTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500/20 via-pink-500/10 to-purple-500/20 text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/10'
                  : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {alertCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  {alertCount}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="ppcSubTab"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* ─── Tab Content ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* ═══════════ CONFIGURATION TAB ═══════════ */}
        {activeSubTab === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* General Group */}
            <div className="glass rounded-xl p-5 sm:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.02] to-transparent pointer-events-none" />
              <div className="relative">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  Général
                </h3>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 mb-4 group hover:border-orange-500/20 transition-colors">
                  <div>
                    <Label className="text-sm font-medium">Système PPC Actif</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Activer ou désactiver la rémunération au clic</p>
                  </div>
                  <Switch
                    checked={formConfig.active}
                    onCheckedChange={(checked) => setFormConfig((prev) => prev ? { ...prev, active: checked } : prev)}
                  />
                </div>

                {/* Rate per click */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Taux par clic (FCFA)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formConfig.ratePerClick}
                    onChange={(e) => setFormConfig((prev) => prev ? { ...prev, ratePerClick: parseFloat(e.target.value) || 0 } : prev)}
                    className="bg-white/5 border-white/10 focus:border-orange-500/40 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Rate Limits Group */}
            <div className="glass rounded-xl p-5 sm:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/[0.02] to-transparent pointer-events-none" />
              <div className="relative">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                    <Ban className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  Limites de Taux
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Max clics/IP/jour
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={formConfig.maxClicksPerIpPerDay}
                      onChange={(e) => setFormConfig((prev) => prev ? { ...prev, maxClicksPerIpPerDay: parseInt(e.target.value) || 1 } : prev)}
                      className="bg-white/5 border-white/10 focus:border-yellow-500/40 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Fingerprint className="w-3 h-3" />
                      Max clics/empreinte/jour
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={formConfig.maxClicksPerFingerprint}
                      onChange={(e) => setFormConfig((prev) => prev ? { ...prev, maxClicksPerFingerprint: parseInt(e.target.value) || 1 } : prev)}
                      className="bg-white/5 border-white/10 focus:border-yellow-500/40 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Max clics/recommandeur/jour
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={formConfig.maxClicksPerRecommender}
                      onChange={(e) => setFormConfig((prev) => prev ? { ...prev, maxClicksPerRecommender: parseInt(e.target.value) || 1 } : prev)}
                      className="bg-white/5 border-white/10 focus:border-yellow-500/40 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Timing Group */}
            <div className="glass rounded-xl p-5 sm:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />
              <div className="relative">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Timer className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  Timing
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Interval min (ms)</Label>
                    <Input
                      type="number"
                      min="1000"
                      value={formConfig.minClickIntervalMs}
                      onChange={(e) => setFormConfig((prev) => prev ? { ...prev, minClickIntervalMs: parseInt(e.target.value) || 1000 } : prev)}
                      className="bg-white/5 border-white/10 focus:border-emerald-500/40 transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground">Délai minimum entre deux clics</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fenêtre vélocité (min)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formConfig.velocityWindowMinutes}
                      onChange={(e) => setFormConfig((prev) => prev ? { ...prev, velocityWindowMinutes: parseInt(e.target.value) || 1 } : prev)}
                      className="bg-white/5 border-white/10 focus:border-emerald-500/40 transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground">Fenêtre de détection de rafales</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Max clics dans fenêtre</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formConfig.maxClicksInVelocityWindow}
                      onChange={(e) => setFormConfig((prev) => prev ? { ...prev, maxClicksInVelocityWindow: parseInt(e.target.value) || 1 } : prev)}
                      className="bg-white/5 border-white/10 focus:border-emerald-500/40 transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground">Seuil de clics dans la fenêtre</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Group */}
            <div className="glass rounded-xl p-5 sm:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] to-transparent pointer-events-none" />
              <div className="relative">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  Sécurité
                </h3>

                {/* Fraud Score Threshold */}
                <div className="space-y-2 mb-4">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Seuil de fraude (0-100)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formConfig.fraudScoreThreshold}
                      onChange={(e) => setFormConfig((prev) => prev ? { ...prev, fraudScoreThreshold: parseInt(e.target.value) || 0 } : prev)}
                      className="bg-white/5 border-white/10 focus:border-red-500/40 transition-colors max-w-[120px]"
                    />
                    <div className="flex-1 h-2 rounded-full bg-white/5 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${formConfig.fraudScoreThreshold}%` }}
                        transition={{ duration: 0.5 }}
                        style={{
                          background: formConfig.fraudScoreThreshold > 70
                            ? 'linear-gradient(to right, #ef4444, #dc2626)'
                            : formConfig.fraudScoreThreshold > 40
                              ? 'linear-gradient(to right, #f97316, #eab308)'
                              : 'linear-gradient(to right, #10b981, #14b8a6)',
                        }}
                      />
                    </div>
                    <span className={`text-sm font-bold min-w-[3ch] ${
                      formConfig.fraudScoreThreshold > 70 ? 'text-red-400'
                        : formConfig.fraudScoreThreshold > 40 ? 'text-yellow-400'
                          : 'text-emerald-400'
                    }`}>
                      {formConfig.fraudScoreThreshold}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Score au-dessus duquel un clic est rejeté automatiquement</p>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-red-500/20 transition-colors">
                    <div>
                      <Label className="text-sm font-medium">Blocage Auto</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Bloquer automatiquement les patterns suspects</p>
                    </div>
                    <Switch
                      checked={formConfig.autoBlockEnabled}
                      onCheckedChange={(checked) => setFormConfig((prev) => prev ? { ...prev, autoBlockEnabled: checked } : prev)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-red-500/20 transition-colors">
                    <div>
                      <Label className="text-sm font-medium">Vérification par Token</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Exiger un token de vérification côté client</p>
                    </div>
                    <Switch
                      checked={formConfig.requireVerification}
                      onCheckedChange={(checked) => setFormConfig((prev) => prev ? { ...prev, requireVerification: checked } : prev)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="w-full h-12 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white font-semibold shadow-lg shadow-orange-500/20 transition-shadow hover:shadow-orange-500/30"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Sauvegarder la Configuration
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════ ALERTES TAB ═══════════ */}
        {activeSubTab === 'alertes' && (
          <motion.div
            key="alertes"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Severity filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mr-1">Filtrer:</span>
              {[
                { id: 'all', label: 'Tous', count: suspiciousActivities.length },
                { id: 'critical', label: 'Critique', count: suspiciousActivities.filter((a) => a.severity === 'critical').length },
                { id: 'high', label: 'Élevé', count: suspiciousActivities.filter((a) => a.severity === 'high').length },
                { id: 'medium', label: 'Moyen', count: suspiciousActivities.filter((a) => a.severity === 'medium').length },
                { id: 'low', label: 'Faible', count: suspiciousActivities.filter((a) => a.severity === 'low').length },
              ].map((filter) => (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSeverityFilter(filter.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    severityFilter === filter.id
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-white/10'
                  }`}
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <span className="text-[10px] opacity-70">({filter.count})</span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Alert summary cards */}
            {overviewData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="glass rounded-xl p-3.5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-rose-500" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Critiques</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{overviewData.suspicious.critical}</p>
                </div>
                <div className="glass rounded-xl p-3.5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Non résolues</p>
                  <p className="text-2xl font-bold text-orange-400 mt-1">{overviewData.suspicious.total}</p>
                </div>
                <div className="glass rounded-xl p-3.5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Taux résolution</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {suspiciousActivities.length > 0 ? '—' : '100%'}
                  </p>
                </div>
                <div className="glass rounded-xl p-3.5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Filtrées</p>
                  <p className="text-2xl font-bold text-purple-400 mt-1">{filteredActivities.length}</p>
                </div>
              </div>
            )}

            {/* Suspicious activities list */}
            <div className="glass rounded-xl p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] to-transparent pointer-events-none" />
              <div className="relative">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Activités Suspectes
                  {filteredActivities.length > 0 && (
                    <Badge className="text-[9px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30" variant="outline">
                      {filteredActivities.length}
                    </Badge>
                  )}
                </h3>

                {filteredActivities.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <ShieldCheck className="w-12 h-12 text-emerald-400/30 mx-auto mb-3" />
                    </motion.div>
                    <p className="text-sm font-medium mb-1">Aucune activité suspecte</p>
                    <p className="text-xs text-muted-foreground/60">
                      {severityFilter !== 'all'
                        ? 'Aucune alerte avec ce niveau de sévérité'
                        : 'Toutes les activités ont été résolues'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
                    {filteredActivities.map((activity, i) => {
                      const ActivityIcon = activityTypeIcons[activity.activityType] || ShieldAlert
                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          whileHover={{ x: 2 }}
                          className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            severityColors[activity.severity] || severityColors.medium
                          }`}>
                            <ActivityIcon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge className={`text-[9px] ${severityColors[activity.severity] || severityColors.medium}`} variant="outline">
                                {severityLabels[activity.severity] || activity.severity}
                              </Badge>
                              <Badge className="text-[9px] bg-white/5 text-muted-foreground border-white/10" variant="outline">
                                {activityTypeLabels[activity.activityType] || activity.activityType}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {activity.recommender?.name || activity.recommender?.phone}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{activity.description}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Clock className="w-3 h-3 text-muted-foreground/50" />
                              <span className="text-[10px] text-muted-foreground/60">
                                {new Date(activity.createdAt).toLocaleString('fr-FR', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 h-7 text-[10px] shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleResolveActivity(activity.id)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Résoudre
                          </Button>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════ AUDIT CLICS TAB ═══════════ */}
        {activeSubTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Top Recommenders */}
            {overviewData && overviewData.topRecommenders.length > 0 && (
              <div className="glass rounded-xl p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] to-transparent pointer-events-none" />
                <div className="relative">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                      <Trophy className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    Top Recommandeurs par Gains
                  </h3>

                  {/* Fraud rate stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="rounded-xl p-3.5 bg-white/[0.02] border border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Recommandeurs actifs</p>
                      <p className="text-xl font-bold gradient-text mt-1">{overviewData.topRecommenders.length}</p>
                    </div>
                    <div className="rounded-xl p-3.5 bg-white/[0.02] border border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Taux fraude moyen</p>
                      <p className="text-xl font-bold text-yellow-400 mt-1">
                        {overviewData.topRecommenders.length > 0
                          ? `${Math.round(
                              overviewData.topRecommenders.reduce((sum, r) => {
                                const total = r.totalValidClicks + r.totalFraudClicks
                                return sum + (total > 0 ? (r.totalFraudClicks / total) * 100 : 0)
                              }, 0) / overviewData.topRecommenders.length
                            )}%`
                          : '0%'
                        }
                      </p>
                    </div>
                    <div className="rounded-xl p-3.5 bg-white/[0.02] border border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gains totaux</p>
                      <p className="text-xl font-bold text-emerald-400 mt-1">
                        {formatPrice(overviewData.topRecommenders.reduce((sum, r) => sum + r.clickEarnings, 0))}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                    {overviewData.topRecommenders.map((rec, i) => {
                      const fraudPct = rec.totalValidClicks + rec.totalFraudClicks > 0
                        ? Math.round(rec.totalFraudClicks / (rec.totalValidClicks + rec.totalFraudClicks) * 100)
                        : 0
                      return (
                        <motion.div
                          key={rec.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          whileHover={{ x: 2 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                            i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            i === 1 ? 'bg-gray-400/20 text-gray-300' :
                            i === 2 ? 'bg-orange-700/20 text-orange-500' :
                            'bg-white/5 text-muted-foreground'
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{rec.name || rec.phone}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">
                                {rec.totalValidClicks} clics valides
                              </span>
                              {rec.totalFraudClicks > 0 && (
                                <span className="text-[10px] text-red-400">
                                  · {rec.totalFraudClicks} fraude ({fraudPct}%)
                                </span>
                              )}
                            </div>
                            {/* Fraud rate bar */}
                            <div className="mt-1.5 h-1 rounded-full bg-white/5 relative overflow-hidden max-w-[120px]">
                              <motion.div
                                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-red-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(fraudPct, 100)}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                              />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold gradient-text">{formatPrice(rec.clickEarnings)}</span>
                          </div>

                          {/* Reject button for high fraud recommenders */}
                          {fraudPct > 30 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 hover:bg-red-500/10 text-red-400 h-7 text-[10px] shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                              disabled={rejectingIds.has(rec.id)}
                              onClick={() => handleRejectClicks(rec.id)}
                            >
                              {rejectingIds.has(rec.id) ? (
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3 mr-1" />
                              )}
                              Rejeter
                            </Button>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Click Audit Section */}
            <div className="glass rounded-xl p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />
              <div className="relative">
                {/* Header with filter */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    Audit des Clics
                  </h3>

                  <div className="flex items-center gap-2">
                    {(['all', 'fraud', 'valid'] as const).map((f) => (
                      <motion.button
                        key={f}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setAuditFilter(f); setAuditPage(1) }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          auditFilter === f
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-white/10'
                        }`}
                      >
                        {f === 'all' ? 'Tous' : f === 'fraud' ? 'Fraude' : 'Valides'}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Bulk actions */}
                {selectedClickIds.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-3"
                  >
                    <span className="text-xs text-red-400 font-medium">
                      {selectedClickIds.size} clic(s) sélectionné(s)
                    </span>
                    <Button
                      size="sm"
                      className="h-7 text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                      variant="outline"
                      onClick={() => {
                        const firstClick = clickAuditData?.clicks.find((c) => selectedClickIds.has(c.id))
                        if (firstClick) {
                          handleRejectClicks(firstClick.recommender.id, Array.from(selectedClickIds))
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Rejeter la sélection
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[10px] text-muted-foreground"
                      onClick={() => setSelectedClickIds(new Set())}
                    >
                      Tout désélectionner
                    </Button>
                  </motion.div>
                )}

                {/* Click list */}
                {!clickAuditData ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-14 rounded-lg bg-white/[0.03] animate-pulse" />
                    ))}
                  </div>
                ) : clickAuditData.clicks.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Eye className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm">Aucun clic trouvé</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
                    {clickAuditData.clicks.map((click, i) => (
                      <motion.div
                        key={click.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        whileHover={{ x: 2 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors group ${
                          click.isFraud
                            ? 'bg-red-500/[0.04] border-red-500/10 hover:border-red-500/20'
                            : click.isVerified
                              ? 'bg-emerald-500/[0.03] border-emerald-500/10 hover:border-emerald-500/20'
                              : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                        }`}
                      >
                        {/* Selection checkbox */}
                        <button
                          onClick={() => toggleClickSelection(click.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                            selectedClickIds.has(click.id)
                              ? 'bg-orange-500/30 border-orange-500/50 text-orange-400'
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          {selectedClickIds.has(click.id) && (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                        </button>

                        {/* Status indicator */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          click.isFraud
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}>
                          {click.isFraud ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </div>

                        {/* Click info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-xs font-medium truncate">
                              {click.recommender?.name || click.recommender?.phone}
                            </span>
                            <Badge className={`text-[9px] ${
                              click.isFraud
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`} variant="outline">
                              {click.isFraud ? 'Fraude' : 'Vérifié'}
                            </Badge>
                            <Badge className="text-[9px] bg-white/5 text-muted-foreground border-white/10" variant="outline">
                              Score: {click.fraudScore}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70 flex-wrap">
                            <span>IP: {click.visitorIp ? `${click.visitorIp.slice(0, 12)}...` : '—'}</span>
                            <span>·</span>
                            <span>{click.deviceType || click.browserName || 'Inconnu'}</span>
                            <span>·</span>
                            <span>{new Date(click.createdAt).toLocaleString('fr-FR', {
                              day: '2-digit', month: 'short',
                              hour: '2-digit', minute: '2-digit',
                            })}</span>
                          </div>
                          {click.fraudReasons && click.fraudReasons !== 'NONE' && (
                            <p className="text-[10px] text-red-400/70 mt-0.5 truncate">
                              {click.fraudReasons}
                            </p>
                          )}
                        </div>

                        {/* Earnings */}
                        <div className="text-right shrink-0">
                          <span className={`text-sm font-bold ${
                            click.isFraud ? 'text-red-400 line-through' : 'gradient-text'
                          }`}>
                            {formatPrice(click.earnings)}
                          </span>
                        </div>

                        {/* Reject individual click */}
                        {click.isVerified && click.earnings > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 hover:bg-red-500/10 text-red-400 h-7 text-[10px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={rejectingIds.has(click.recommender.id)}
                            onClick={() => handleRejectClicks(click.recommender.id, [click.id])}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {clickAuditData && clickAuditData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    <p className="text-xs text-muted-foreground">
                      {clickAuditData.total} clic(s) · Page {clickAuditData.page}/{clickAuditData.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] border-white/10"
                        disabled={auditPage <= 1}
                        onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                      >
                        Précédent
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] border-white/10"
                        disabled={auditPage >= clickAuditData.totalPages}
                        onClick={() => setAuditPage((p) => p + 1)}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


