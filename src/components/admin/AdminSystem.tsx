'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Heart, Database, Save, RefreshCw, Cpu,
  Clock, MemoryStick, Server, HardDrive, Zap, Globe,
  Mail, Phone, Percent, DollarSign, Type, FileText,
  DatabaseIcon, Users, Package, ShoppingCart, Globe2,
  Trophy, Target, Gift, ShieldAlert, CreditCard, Wrench,
  Sparkles, AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

// ─── Types ──────────────────────────────────────────────────────────
interface SystemStats {
  records: Record<string, number>
  totalRecords: number
  databaseSize: {
    bytes: number
    humanReadable: string
  }
  system: {
    nodeVersion: string
    platform: string
    uptime: number
    memoryUsage: {
      rss: string
      heapUsed: string
      heapTotal: string
    }
  }
}

type SubTab = 'parametres' | 'sante' | 'database'

interface SettingField {
  key: string
  label: string
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea'
  placeholder: string
  defaultValue: string
  icon: React.ElementType
  iconColor: string
}

// ─── Settings Configuration ─────────────────────────────────────────
const settingsConfig: SettingField[] = [
  {
    key: 'app_name',
    label: "Nom de l'application",
    type: 'text',
    placeholder: 'Kidenzo',
    defaultValue: 'Kidenzo',
    icon: Type,
    iconColor: 'text-orange-400',
  },
  {
    key: 'currency',
    label: 'Devise',
    type: 'text',
    placeholder: 'FCFA',
    defaultValue: 'FCFA',
    icon: DollarSign,
    iconColor: 'text-emerald-400',
  },
  {
    key: 'app_description',
    label: "Description de l'application",
    type: 'textarea',
    placeholder: 'Plateforme de recommandation de produits...',
    defaultValue: '',
    icon: FileText,
    iconColor: 'text-purple-400',
  },
  {
    key: 'contact_email',
    label: 'Email de contact',
    type: 'email',
    placeholder: 'contact@kidenzo.com',
    defaultValue: '',
    icon: Mail,
    iconColor: 'text-pink-400',
  },
  {
    key: 'contact_phone',
    label: 'Téléphone de contact',
    type: 'tel',
    placeholder: '+243 000 000 000',
    defaultValue: '',
    icon: Phone,
    iconColor: 'text-amber-400',
  },
  {
    key: 'default_max_commission',
    label: 'Commission max par défaut (%)',
    type: 'number',
    placeholder: '40',
    defaultValue: '40',
    icon: Percent,
    iconColor: 'text-cyan-400',
  },
  {
    key: 'default_ppc_rate',
    label: 'Tarif PPC par défaut (FCFA)',
    type: 'number',
    placeholder: '5',
    defaultValue: '5',
    icon: Zap,
    iconColor: 'text-yellow-400',
  },
]

// ─── Model display config ───────────────────────────────────────────
const modelDisplay: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  users: { label: 'Utilisateurs', icon: Users, color: 'from-orange-500 to-amber-500' },
  products: { label: 'Produits', icon: Package, color: 'from-emerald-500 to-teal-500' },
  orders: { label: 'Commandes', icon: ShoppingCart, color: 'from-pink-500 to-rose-500' },
  miniSites: { label: 'Mini-Sites', icon: Globe2, color: 'from-purple-500 to-violet-500' },
  badges: { label: 'Badges', icon: Trophy, color: 'from-yellow-500 to-amber-500' },
  achievements: { label: 'Succès', icon: Target, color: 'from-cyan-500 to-blue-500' },
  dailyQuests: { label: 'Quêtes', icon: Gift, color: 'from-rose-500 to-pink-500' },
  rewards: { label: 'Récompenses', icon: Sparkles, color: 'from-indigo-500 to-purple-500' },
  clickEvents: { label: 'Événements de clic', icon: Cpu, color: 'from-teal-500 to-emerald-500' },
  suspiciousActivities: { label: 'Activités suspectes', icon: ShieldAlert, color: 'from-red-500 to-rose-500' },
  commissionPayments: { label: 'Paiements commission', icon: CreditCard, color: 'from-amber-500 to-orange-500' },
  systemConfigs: { label: 'Config. système', icon: Wrench, color: 'from-gray-400 to-slate-400' },
}

// ─── Helpers ────────────────────────────────────────────────────────
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []
  if (days > 0) parts.push(`${days}j`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}min`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}

function parseMemoryMB(memStr: string): number {
  return parseFloat(memStr.replace(' MB', ''))
}

// ─── Sub-tab Navigation ─────────────────────────────────────────────
const subTabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: 'parametres', label: 'Paramètres', icon: Settings },
  { id: 'sante', label: 'Santé Système', icon: Heart },
  { id: 'database', label: 'Base de Données', icon: Database },
]

// ─── Skeleton Loader ────────────────────────────────────────────────
function SettingsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/5" />
            <div className="h-4 w-32 rounded bg-white/5" />
          </div>
          <div className="h-10 w-full rounded-lg bg-white/5" />
        </div>
      ))}
    </div>
  )
}

function HealthSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/5" />
            <div className="flex-1">
              <div className="h-3 w-24 rounded bg-white/5 mb-2" />
              <div className="h-5 w-20 rounded bg-white/5" />
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-white/5 mt-3" />
        </div>
      ))}
    </div>
  )
}

function DatabaseSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/5" />
          <div className="flex-1">
            <div className="h-4 w-32 rounded bg-white/5 mb-2" />
            <div className="h-3 w-20 rounded bg-white/5" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="glass rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-white/5 mb-3" />
            <div className="h-6 w-10 rounded bg-white/5 mb-1" />
            <div className="h-3 w-20 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Progress Bar Component ─────────────────────────────────────────
function ProgressBar({ value, max, gradient, label }: {
  value: number
  max: number
  gradient: string
  label?: string
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full">
      {label && <p className="text-[10px] text-muted-foreground mb-1">{label}</p>}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────
export function AdminSystem() {
  const [activeTab, setActiveTab] = useState<SubTab>('parametres')
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [originalSettings, setOriginalSettings] = useState<Record<string, string>>({})
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [seedLoading, setSeedLoading] = useState(false)

  // ─── Fetch system stats ──────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const res = await fetch('/api/admin?action=system-stats')
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch system stats:', err)
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  // ─── Fetch settings ──────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setIsLoadingSettings(true)
    try {
      const res = await fetch('/api/admin?action=system-settings')
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      setSettings(data.settings || {})
      setOriginalSettings(data.settings || {})
    } catch (err) {
      console.error('Failed to fetch settings:', err)
      // Apply defaults
      const defaults: Record<string, string> = {}
      settingsConfig.forEach((s) => {
        defaults[s.key] = s.defaultValue
      })
      setSettings(defaults)
      setOriginalSettings(defaults)
    } finally {
      setIsLoadingSettings(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchStats()
  }, [fetchSettings, fetchStats])

  // ─── Save settings ───────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    try {
      // Only send changed settings
      const changed: Record<string, string> = {}
      for (const [key, value] of Object.entries(settings)) {
        if (value !== (originalSettings[key] ?? '')) {
          changed[key] = value
        }
      }

      if (Object.keys(changed).length === 0) {
        setSaveMessage({ type: 'success', text: 'Aucune modification à sauvegarder' })
        setIsSaving(false)
        return
      }

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-system', settings: changed }),
      })

      if (!res.ok) throw new Error('Erreur lors de la sauvegarde')

      setOriginalSettings({ ...settings })
      setSaveMessage({ type: 'success', text: `${Object.keys(changed).length} paramètre(s) sauvegardé(s) avec succès` })

      // Clear message after 3s
      setTimeout(() => setSaveMessage(null), 3000)
    } catch {
      setSaveMessage({ type: 'error', text: 'Erreur lors de la sauvegarde des paramètres' })
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Seed data placeholder ───────────────────────────────────────
  const handleSeedData = async () => {
    setSeedLoading(true)
    // Simulated delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSeedLoading(false)
  }

  // ─── Check if settings have changes ──────────────────────────────
  const hasChanges = Object.keys(settings).some(
    (key) => settings[key] !== (originalSettings[key] ?? '')
  )

  // ─── Get setting value with default fallback ─────────────────────
  const getSettingValue = (key: string, defaultValue: string): string => {
    return settings[key] ?? defaultValue
  }

  // ─── Update a single setting ─────────────────────────────────────
  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  // ─── Tab content animation variants ──────────────────────────────
  const tabVariants = {
    enter: { opacity: 0, y: 12 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  }

  // ─── Render: Paramètres Tab ──────────────────────────────────────
  const renderParametres = () => {
    if (isLoadingSettings) return <SettingsSkeleton />

    return (
      <motion.div
        key="parametres"
        variants={tabVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="space-y-4"
      >
        {/* Save banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
              <Settings className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Configuration générale</h3>
              <p className="text-xs text-muted-foreground">
                Modifiez les paramètres de votre plateforme
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {hasChanges && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0"
              />
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={`gap-2 text-sm font-medium transition-all ${
                hasChanges
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </motion.div>

        {/* Save message */}
        <AnimatePresence>
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`glass rounded-xl p-3 flex items-center gap-2 border ${
                saveMessage.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-red-500/30 bg-red-500/5'
              }`}
            >
              {saveMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className={`text-xs font-medium ${
                saveMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {saveMessage.text}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings fields */}
        <div className="space-y-3">
          {settingsConfig.map((field, index) => {
            const Icon = field.icon
            return (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="glass rounded-xl p-4 group hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-4 h-4 ${field.iconColor}`} />
                  </div>
                  <Label className="text-sm font-medium">{field.label}</Label>
                </div>

                {field.type === 'textarea' ? (
                  <Textarea
                    value={getSettingValue(field.key, field.defaultValue)}
                    onChange={(e) => updateSetting(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-white/5 border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20 resize-none min-h-[80px] text-sm"
                  />
                ) : (
                  <Input
                    type={field.type}
                    value={getSettingValue(field.key, field.defaultValue)}
                    onChange={(e) => updateSetting(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-white/5 border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20 text-sm"
                  />
                )}

                {settings[field.key] !== (originalSettings[field.key] ?? '') && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-orange-400 mt-1.5 flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    Modifié
                  </motion.p>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  // ─── Render: Santé Système Tab ───────────────────────────────────
  const renderSante = () => {
    if (isLoadingStats || !stats) return <HealthSkeleton />

    const heapUsed = parseMemoryMB(stats.system.memoryUsage.heapUsed)
    const heapTotal = parseMemoryMB(stats.system.memoryUsage.heapTotal)
    const rss = parseMemoryMB(stats.system.memoryUsage.rss)
    const memoryPct = heapTotal > 0 ? (heapUsed / heapTotal) * 100 : 0

    return (
      <motion.div
        key="sante"
        variants={tabVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="space-y-4"
      >
        {/* Health overview banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Heart className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">État du système</h3>
                <p className="text-xs text-muted-foreground">
                  Surveillance en temps réel des performances
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchStats}
              disabled={isLoadingStats}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
              Actualiser
            </motion.button>
          </div>

          {/* Status indicators */}
          <div className="relative flex flex-wrap items-center gap-2 mt-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">En ligne</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
              <Clock className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-medium text-orange-400">
                Uptime: {formatUptime(stats.system.uptime)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* System metrics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Node.js Version */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-5 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Server className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Node.js</p>
                <p className="text-lg font-bold gradient-text">{stats.system.nodeVersion}</p>
              </div>
            </div>
          </motion.div>

          {/* Platform */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-xl p-5 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-500" />
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plateforme</p>
                <p className="text-lg font-bold gradient-text">{stats.system.platform}</p>
              </div>
            </div>
          </motion.div>

          {/* Uptime */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-5 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500" />
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Temps d&apos;activité</p>
                <p className="text-lg font-bold gradient-text-warm">{formatUptime(stats.system.uptime)}</p>
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar
                value={(stats.system.uptime % 86400) / 86400 * 100}
                max={100}
                gradient="from-orange-500 to-amber-400"
                label={`${Math.floor(stats.system.uptime / 3600)} heures`}
              />
            </div>
          </motion.div>

          {/* Memory Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-xl p-5 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MemoryStick className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mémoire</p>
                <p className="text-lg font-bold gradient-text-warm">{heapUsed.toFixed(1)} MB</p>
              </div>
            </div>

            {/* Memory breakdown */}
            <div className="space-y-2 mt-3">
              <ProgressBar
                value={heapUsed}
                max={heapTotal}
                gradient="from-pink-500 to-rose-400"
                label={`Heap: ${heapUsed.toFixed(1)} / ${heapTotal.toFixed(1)} MB (${memoryPct.toFixed(0)}%)`}
              />
              <ProgressBar
                value={rss}
                max={512}
                gradient="from-purple-500 to-violet-400"
                label={`RSS: ${rss.toFixed(1)} MB`}
              />
            </div>

            {/* Memory stats row */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="rounded-lg bg-white/[0.03] p-2 text-center">
                <p className="text-[10px] text-muted-foreground">RSS</p>
                <p className="text-xs font-bold">{rss.toFixed(1)} MB</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Heap utilisé</p>
                <p className="text-xs font-bold">{heapUsed.toFixed(1)} MB</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Heap total</p>
                <p className="text-xs font-bold">{heapTotal.toFixed(1)} MB</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  // ─── Render: Base de Données Tab ─────────────────────────────────
  const renderDatabase = () => {
    if (isLoadingStats || !stats) return <DatabaseSkeleton />

    return (
      <motion.div
        key="database"
        variants={tabVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="space-y-4"
      >
        {/* Database overview card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Base de données</h3>
                <p className="text-xs text-muted-foreground">
                  SQLite · Taille: <span className="font-semibold text-cyan-400">{stats.databaseSize.humanReadable}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <Database className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">
                  <span className="gradient-text-warm">{stats.totalRecords}</span> enregistrements
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Records per model grid */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Enregistrements par modèle
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(stats.records).map(([key, count], index) => {
              const display = modelDisplay[key] || {
                label: key,
                icon: DatabaseIcon,
                color: 'from-gray-400 to-slate-400',
              }
              const Icon = display.icon
              const pct = stats.totalRecords > 0 ? (count / stats.totalRecords) * 100 : 0

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.04, duration: 0.4 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  className="glass rounded-xl p-4 relative overflow-hidden group cursor-default"
                >
                  {/* Top gradient accent */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${display.color}`} />
                  {/* Hover glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${display.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 rounded-xl`} />

                  <div className="relative">
                    <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold gradient-text">{count}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{display.label}</p>

                    {/* Mini progress bar */}
                    {pct > 0 && (
                      <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${display.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(pct, 2)}%` }}
                          transition={{ duration: 0.8, delay: index * 0.05 }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Database details */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-5"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Globe className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Données de test</h4>
                <p className="text-xs text-muted-foreground">
                  Remplir la base avec des données exemple
                </p>
              </div>
            </div>
            <Button
              onClick={handleSeedData}
              disabled={seedLoading}
              variant="outline"
              className="gap-2 text-sm border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
            >
              {seedLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {seedLoading ? 'Chargement...' : 'Insérer données test'}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-2">
            ⚠️ Cette action ajoutera des données fictives à la base. À utiliser uniquement en développement.
          </p>
        </motion.div>
      </motion.div>
    )
  }

  // ─── Main render ─────────────────────────────────────────────────
  return (
    <div className="space-y-5">
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
            <span className="animated-gradient-text">Système</span>
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Configuration et surveillance de votre plateforme
          </motion.p>
        </div>
      </motion.div>

      {/* ─── Sub-tabs ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-1 p-1 glass rounded-xl"
      >
        {subTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-white shadow-lg border border-orange-500/20'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : ''}`} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
            </motion.button>
          )
        })}
      </motion.div>

      {/* ─── Tab Content ────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'parametres' && renderParametres()}
        {activeTab === 'sante' && renderSante()}
        {activeTab === 'database' && renderDatabase()}
      </AnimatePresence>
    </div>
  )
}
