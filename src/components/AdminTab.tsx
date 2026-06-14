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
  XCircle,
  Save,
  RefreshCw,
  Ban,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Activity,
  TrendingUp,
} from 'lucide-react'
import { useAppStore, formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { PPCConfig, SuspiciousActivityData } from '@/lib/store'

const severityColors: Record<string, string> = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const activityTypeIcons: Record<string, React.ElementType> = {
  velocity: Activity,
  duplicate_ip: ShieldAlert,
  duplicate_fingerprint: ShieldAlert,
  bot: ShieldAlert,
  proxy: ShieldAlert,
  anomaly: AlertTriangle,
  unknown: ShieldAlert,
}

export function AdminTab() {
  const { user, ppcConfig, setPPCConfig } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<'config' | 'audit' | 'suspicious'>('config')
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivityData[]>([])
  const [overviewData, setOverviewData] = useState<{
    today: { totalClicks: number; validClicks: number; fraudClicks: number; fraudRate: number; totalEarnings: number }
    suspicious: { total: number; critical: number }
    topRecommenders: Array<{
      id: string; name: string | null; phone: string; clickEarnings: number; totalValidClicks: number; totalFraudClicks: number
    }>
  } | null>(null)

  // Local form state for config
  const [formConfig, setFormConfig] = useState<PPCConfig | null>(null)

  const fetchConfig = useCallback(async () => {
    setIsLoading(true)
    try {
      const [configRes, overviewRes, suspiciousRes] = await Promise.all([
        fetch('/api/admin?action=ppc-config'),
        fetch('/api/admin?action=overview'),
        fetch('/api/admin?action=suspicious&limit=20'),
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
      console.error('Failed to fetch admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [setPPCConfig])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSaveConfig = async () => {
    if (!formConfig) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-ppc',
          ...formConfig,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPPCConfig(data.config)
        setFormConfig(data.config)
      }
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleResolveActivity = async (activityId: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve-suspicious',
          activityId,
          resolvedBy: user?.id,
        }),
      })
      if (res.ok) {
        setSuspiciousActivities((prev) => prev.filter((a) => a.id !== activityId))
      }
    } catch (error) {
      console.error('Failed to resolve activity:', error)
    }
  }

  if (isLoading || !formConfig) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-52 rounded-lg bg-muted/30 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-xl p-4 h-28 animate-pulse" />
          ))}
        </div>
        <div className="glass rounded-xl p-6 h-64 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.h2
          className="text-xl font-bold gradient-text-warm flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Shield className="w-6 h-6 text-orange-400" />
          Administration PPC
        </motion.h2>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchConfig}
            className="border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Actualiser
          </Button>
        </motion.div>
      </div>

      {/* Overview Stats */}
      {overviewData && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Clics Aujourd\'hui', value: overviewData.today.totalClicks, icon: MousePointerClick, color: 'text-orange-400', bgColor: 'bg-orange-500/15' },
            { label: 'Clics Valides', value: overviewData.today.validClicks, icon: ShieldCheck, color: 'text-emerald-400', bgColor: 'bg-emerald-500/15' },
            { label: 'Clics Fraude', value: overviewData.today.fraudClicks, icon: ShieldAlert, color: 'text-red-400', bgColor: 'bg-red-500/15' },
            { label: 'Taux Fraude', value: `${overviewData.today.fraudRate}%`, icon: TrendingUp, color: 'text-yellow-400', bgColor: 'bg-yellow-500/15' },
            { label: 'Dépenses Jour', value: formatPrice(overviewData.today.totalEarnings), icon: DollarSign, color: 'text-purple-400', bgColor: 'bg-purple-500/15' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="glass rounded-xl p-3 relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <div className="text-lg font-bold">{stat.value}</div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'config' as const, label: 'Configuration', icon: Settings },
          { id: 'suspicious' as const, label: `Alertes (${overviewData?.suspicious.total ?? 0})`, icon: AlertTriangle },
          { id: 'audit' as const, label: 'Top Recommandeurs', icon: Users },
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
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
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
        {/* Configuration Section */}
        {activeSection === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-5 space-y-5"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-400" />
              Paramètres Rémunération au Clic
            </h3>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div>
                <Label className="text-sm font-medium">Système PPC Actif</Label>
                <p className="text-xs text-muted-foreground">Activer ou désactiver la rémunération au clic</p>
              </div>
              <Switch
                checked={formConfig.active}
                onCheckedChange={(checked) => setFormConfig((prev) => prev ? { ...prev, active: checked } : prev)}
              />
            </div>

            {/* Rate per click */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Taux par clic (FCFA)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formConfig.ratePerClick}
                  onChange={(e) => setFormConfig((prev) => prev ? { ...prev, ratePerClick: parseFloat(e.target.value) || 0 } : prev)}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Seuil de fraude (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formConfig.fraudScoreThreshold}
                  onChange={(e) => setFormConfig((prev) => prev ? { ...prev, fraudScoreThreshold: parseInt(e.target.value) || 0 } : prev)}
                  className="bg-white/5 border-white/10"
                />
                <p className="text-[10px] text-muted-foreground">Score au-dessus duquel un clic est rejeté</p>
              </div>
            </div>

            {/* Rate Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Max clics/IP/jour</Label>
                <Input
                  type="number"
                  min="1"
                  value={formConfig.maxClicksPerIpPerDay}
                  onChange={(e) => setFormConfig((prev) => prev ? { ...prev, maxClicksPerIpPerDay: parseInt(e.target.value) || 1 } : prev)}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Max clics/empreinte/jour</Label>
                <Input
                  type="number"
                  min="1"
                  value={formConfig.maxClicksPerFingerprint}
                  onChange={(e) => setFormConfig((prev) => prev ? { ...prev, maxClicksPerFingerprint: parseInt(e.target.value) || 1 } : prev)}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Max clics/recommandeur/jour</Label>
                <Input
                  type="number"
                  min="1"
                  value={formConfig.maxClicksPerRecommender}
                  onChange={(e) => setFormConfig((prev) => prev ? { ...prev, maxClicksPerRecommender: parseInt(e.target.value) || 1 } : prev)}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            {/* Timing Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Interval min (ms)</Label>
                <Input
                  type="number"
                  min="1000"
                  value={formConfig.minClickIntervalMs}
                  onChange={(e) => setFormConfig((prev) => prev ? { ...prev, minClickIntervalMs: parseInt(e.target.value) || 1000 } : prev)}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fenêtre vélocité (min)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formConfig.velocityWindowMinutes}
                  onChange={(e) => setFormConfig((prev) => prev ? { ...prev, velocityWindowMinutes: parseInt(e.target.value) || 1 } : prev)}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Max clics dans fenêtre</Label>
                <Input
                  type="number"
                  min="1"
                  value={formConfig.maxClicksInVelocityWindow}
                  onChange={(e) => setFormConfig((prev) => prev ? { ...prev, maxClicksInVelocityWindow: parseInt(e.target.value) || 1 } : prev)}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            {/* Security Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div>
                  <Label className="text-sm font-medium">Blocage Auto</Label>
                  <p className="text-xs text-muted-foreground">Bloquer automatiquement les patterns suspects</p>
                </div>
                <Switch
                  checked={formConfig.autoBlockEnabled}
                  onCheckedChange={(checked) => setFormConfig((prev) => prev ? { ...prev, autoBlockEnabled: checked } : prev)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div>
                  <Label className="text-sm font-medium">Vérification par Token</Label>
                  <p className="text-xs text-muted-foreground">Exiger un token de vérification côté client</p>
                </div>
                <Switch
                  checked={formConfig.requireVerification}
                  onCheckedChange={(checked) => setFormConfig((prev) => prev ? { ...prev, requireVerification: checked } : prev)}
                />
              </div>
            </div>

            {/* Save Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="w-full h-11 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white font-semibold shadow-lg shadow-orange-500/20"
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

        {/* Suspicious Activities */}
        {activeSection === 'suspicious' && (
          <motion.div
            key="suspicious"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Activités Suspectes
            </h3>
            {suspiciousActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <ShieldCheck className="w-10 h-10 text-emerald-400/30 mx-auto mb-3" />
                Aucune activité suspecte non résolue
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {suspiciousActivities.map((activity, i) => {
                  const ActivityIcon = activityTypeIcons[activity.activityType] || ShieldAlert
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        severityColors[activity.severity] || severityColors.medium
                      }`}>
                        <ActivityIcon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[9px] ${severityColors[activity.severity] || severityColors.medium}`} variant="outline">
                            {activity.severity}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {activity.recommender?.name || activity.recommender?.phone}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <span className="text-[10px] text-muted-foreground/60">
                          {new Date(activity.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 h-7 text-[10px] shrink-0"
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
          </motion.div>
        )}

        {/* Top Recommenders */}
        {activeSection === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Top Recommandeurs par Gains
            </h3>
            {(!overviewData?.topRecommenders || overviewData.topRecommenders.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                Aucun recommandeur actif
              </div>
            ) : (
              <div className="space-y-2">
                {overviewData.topRecommenders.map((rec, i) => {
                  const fraudPct = rec.totalValidClicks + rec.totalFraudClicks > 0
                    ? Math.round(rec.totalFraudClicks / (rec.totalValidClicks + rec.totalFraudClicks) * 100)
                    : 0
                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        i === 1 ? 'bg-gray-400/20 text-gray-300' :
                        i === 2 ? 'bg-orange-700/20 text-orange-500' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rec.name || rec.phone}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {rec.totalValidClicks} clics valides
                          {rec.totalFraudClicks > 0 && (
                            <span className="text-red-400 ml-1">· {rec.totalFraudClicks} fraude ({fraudPct}%)</span>
                          )}
                        </p>
                      </div>
                      <span className="text-sm font-bold gradient-text">
                        {formatPrice(rec.clickEarnings)}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
