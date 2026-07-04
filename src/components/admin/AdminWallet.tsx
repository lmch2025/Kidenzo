'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  CreditCard,
  PiggyBank,
  AlertTriangle,
  Bell,
  Settings2,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import { formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type SubTab = 'config' | 'credits' | 'savings'

interface WalletConfig {
  wallet_min_down_payment_pct: string
  wallet_max_down_payment_pct: string
  wallet_max_installment_days: string
  wallet_min_installment_days: string
  wallet_daily_reminder_enabled: string
  wallet_daily_reminder_hour: string
  wallet_late_penalty_enabled: string
  wallet_late_penalty_pct: string
  wallet_max_active_plans: string
  wallet_max_active_goals: string
  wallet_min_savings_deposit: string
  wallet_credit_enabled: string
  wallet_savings_enabled: string
}

interface AdminWalletStats {
  credit: {
    total: number
    active: number
    completed: number
    overdue: number
    totalAmount: number
    remainingAmount: number
  }
  savings: {
    total: number
    active: number
    completed: number
    targetAmount: number
    currentAmount: number
  }
  pushSubscriptions: number
}

const subTabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: 'config', label: 'Configuration', icon: Settings2 },
  { id: 'credits', label: 'Crédits Récents', icon: CreditCard },
  { id: 'savings', label: 'Épargnes Récentes', icon: PiggyBank },
]

export function AdminWallet() {
  const [activeTab, setActiveTab] = useState<SubTab>('config')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [triggeringCron, setTriggeringCron] = useState(false)
  
  const [stats, setStats] = useState<AdminWalletStats | null>(null)
  const [recentPlans, setRecentPlans] = useState<any[]>([])
  const [recentGoals, setRecentGoals] = useState<any[]>([])
  
  const [config, setConfig] = useState<WalletConfig>({
    wallet_min_down_payment_pct: '20',
    wallet_max_down_payment_pct: '80',
    wallet_max_installment_days: '180',
    wallet_min_installment_days: '7',
    wallet_daily_reminder_enabled: 'true',
    wallet_daily_reminder_hour: '9',
    wallet_late_penalty_enabled: 'false',
    wallet_late_penalty_pct: '0',
    wallet_max_active_plans: '5',
    wallet_max_active_goals: '10',
    wallet_min_savings_deposit: '100',
    wallet_credit_enabled: 'true',
    wallet_savings_enabled: 'true',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin?action=wallet-overview')
      const data = await res.json()
      
      if (data.stats) setStats(data.stats)
      if (data.recentPlans) setRecentPlans(data.recentPlans)
      if (data.recentGoals) setRecentGoals(data.recentGoals)
      if (data.config) {
        setConfig(data.config as WalletConfig)
      }
    } catch (error) {
      console.error('Failed to fetch wallet admin data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-wallet-config',
          settings: config
        }),
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('Configuration sauvegardée avec succès')
      } else {
        toast.error(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  const handleTriggerCron = async () => {
    try {
      setTriggeringCron(true)
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger-wallet-cron' }),
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success(data.cronResult?.summary || 'Rappels envoyés avec succès')
      } else {
        toast.error(data.error || 'Erreur lors du déclenchement')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setTriggeringCron(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Header & Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Crédits Actifs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group p-4 rounded-2xl bg-black/40 border border-white/5 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Crédits Actifs</span>
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-orange-400" />
              </div>
            </div>
            <div className="text-2xl font-bold">{stats?.credit.active || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sur {stats?.credit.total || 0} crédits
            </p>
          </div>
        </motion.div>

        {/* Épargnes Actives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group p-4 rounded-2xl bg-black/40 border border-white/5 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Épargnes</span>
              <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-pink-400" />
              </div>
            </div>
            <div className="text-2xl font-bold">{stats?.savings.active || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sur {stats?.savings.total || 0} objectifs
            </p>
          </div>
        </motion.div>

        {/* Retards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group p-4 rounded-2xl bg-black/40 border border-white/5 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">En Retard</span>
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-400">{stats?.credit.overdue || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Crédits à relancer
            </p>
          </div>
        </motion.div>

        {/* Abonnements Push */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative group p-4 rounded-2xl bg-black/40 border border-white/5 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Push Notifs</span>
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold">{stats?.pushSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Appareils inscrits
            </p>
          </div>
        </motion.div>
      </div>

      {/* ─── Navigation Tabs ────────────────────────────────────────────── */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl overflow-x-auto scrollbar-none">
        {subTabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 min-w-[150px] justify-center ${
                isActive ? 'text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="walletAdminTab"
                  className="absolute inset-0 bg-white/10 rounded-lg border border-white/10 shadow-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ─── Tab Content ───────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                
                {/* Configuration Crédit */}
                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Achats à Tempérament</h3>
                      <p className="text-xs text-muted-foreground">Règles du crédit</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Activer le crédit</Label>
                      <Switch 
                        checked={config.wallet_credit_enabled === 'true'}
                        onCheckedChange={(c) => setConfig({ ...config, wallet_credit_enabled: c ? 'true' : 'false' })}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Acompte Minimum (%)</Label>
                        <span className="text-sm font-bold text-orange-400">{config.wallet_min_down_payment_pct}%</span>
                      </div>
                      <Slider
                        value={[parseInt(config.wallet_min_down_payment_pct)]}
                        min={10}
                        max={50}
                        step={5}
                        onValueChange={(v) => setConfig({ ...config, wallet_min_down_payment_pct: String(v[0]) })}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Acompte Maximum (%)</Label>
                        <span className="text-sm font-bold text-orange-400">{config.wallet_max_down_payment_pct}%</span>
                      </div>
                      <Slider
                        value={[parseInt(config.wallet_max_down_payment_pct)]}
                        min={50}
                        max={90}
                        step={5}
                        onValueChange={(v) => setConfig({ ...config, wallet_max_down_payment_pct: String(v[0]) })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Durée min (jours)</Label>
                        <Input 
                          type="number"
                          value={config.wallet_min_installment_days}
                          onChange={(e) => setConfig({ ...config, wallet_min_installment_days: e.target.value })}
                          className="bg-black/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Durée max (jours)</Label>
                        <Input 
                          type="number"
                          value={config.wallet_max_installment_days}
                          onChange={(e) => setConfig({ ...config, wallet_max_installment_days: e.target.value })}
                          className="bg-black/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Crédits simultanés maximum par client</Label>
                      <Input 
                        type="number"
                        value={config.wallet_max_active_plans}
                        onChange={(e) => setConfig({ ...config, wallet_max_active_plans: e.target.value })}
                        className="bg-black/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Configuration Épargne & Notifications */}
                <div className="space-y-6">
                  {/* Épargne */}
                  <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                        <PiggyBank className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Épargne Progressive</h3>
                        <p className="text-xs text-muted-foreground">Règles d'épargne</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Activer l'épargne</Label>
                        <Switch 
                          checked={config.wallet_savings_enabled === 'true'}
                          onCheckedChange={(c) => setConfig({ ...config, wallet_savings_enabled: c ? 'true' : 'false' })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Dépôt min (FCFA)</Label>
                          <Input 
                            type="number"
                            value={config.wallet_min_savings_deposit}
                            onChange={(e) => setConfig({ ...config, wallet_min_savings_deposit: e.target.value })}
                            className="bg-black/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Objectifs max</Label>
                          <Input 
                            type="number"
                            value={config.wallet_max_active_goals}
                            onChange={(e) => setConfig({ ...config, wallet_max_active_goals: e.target.value })}
                            className="bg-black/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <Bell className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Rappels & Push</h3>
                          <p className="text-xs text-muted-foreground">Notifications journalières</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTriggerCron}
                        disabled={triggeringCron}
                        className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white h-9"
                      >
                        {triggeringCron ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2 text-blue-400" />
                        )}
                        Tester Cron
                      </Button>
                    </div>

                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Rappels Quotidiens Automatiques</Label>
                        <Switch 
                          checked={config.wallet_daily_reminder_enabled === 'true'}
                          onCheckedChange={(c) => setConfig({ ...config, wallet_daily_reminder_enabled: c ? 'true' : 'false' })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Fréquence des rappels (cron-job.org)</Label>
                        <Select 
                          value={config.wallet_daily_reminder_hour} 
                          onValueChange={(v) => setConfig({ ...config, wallet_daily_reminder_hour: v })}
                        >
                          <SelectTrigger className="bg-black/20">
                            <SelectValue placeholder="Sélectionnez la fréquence" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9">1 fois par jour (09:00)</SelectItem>
                            <SelectItem value="8,18">2 fois par jour (08:00, 18:00)</SelectItem>
                            <SelectItem value="8,12,18">3 fois par jour (08:00, 12:00, 18:00)</SelectItem>
                            <SelectItem value="7,12,17,20">4 fois par jour (07:00, 12:00, 17:00, 20:00)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-white/40">Géré automatiquement via l'API cron-job.org</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <Label className="text-sm">Pénalité de retard</Label>
                        <Switch 
                          checked={config.wallet_late_penalty_enabled === 'true'}
                          onCheckedChange={(c) => setConfig({ ...config, wallet_late_penalty_enabled: c ? 'true' : 'false' })}
                        />
                      </div>
                      
                      {config.wallet_late_penalty_enabled === 'true' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label>Pénalité par jour (%)</Label>
                            <span className="text-sm font-bold text-red-400">{config.wallet_late_penalty_pct}%</span>
                          </div>
                          <Slider
                            value={[parseFloat(config.wallet_late_penalty_pct)]}
                            min={0}
                            max={10}
                            step={0.5}
                            onValueChange={(v) => setConfig({ ...config, wallet_late_penalty_pct: String(v[0]) })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <Button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white min-w-[200px]"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                  )}
                  Enregistrer les paramètres
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="p-6 rounded-2xl bg-black/40 border border-white/5">
              <h3 className="font-semibold text-lg mb-6">10 Derniers Crédits</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Client</th>
                      <th className="px-4 py-3">Produit</th>
                      <th className="px-4 py-3">Montant / Reste</th>
                      <th className="px-4 py-3">Progression</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 rounded-r-lg">Prochaine Échéance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPlans.map((plan) => (
                      <tr key={plan.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {plan.user?.name || 'Inconnu'}<br/>
                          <span className="text-xs text-muted-foreground">{plan.user?.phone}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-[200px] truncate" title={plan.productName}>
                            {plan.productName}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{formatPrice(plan.totalAmount)}</div>
                          <div className="text-xs text-muted-foreground">Reste {formatPrice(plan.remainingAmount)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold w-8">{Math.round((plan.paidInstallments / plan.totalInstallments) * 100)}%</span>
                            <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div 
                                className="h-full bg-orange-500 rounded-full" 
                                style={{ width: `${(plan.paidInstallments / plan.totalInstallments) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={
                            plan.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            plan.status === 'active' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }>
                            {plan.status === 'completed' ? 'Terminé' :
                             plan.status === 'active' ? 'En cours' : 'Annulé'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground flex items-center gap-1.5">
                          {plan.nextDueDate ? (
                            <>
                              <Clock className="w-3 h-3" />
                              {new Date(plan.nextDueDate).toLocaleDateString('fr-FR')}
                            </>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                    {recentPlans.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          Aucun crédit récent
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'savings' && (
            <div className="p-6 rounded-2xl bg-black/40 border border-white/5">
              <h3 className="font-semibold text-lg mb-6">10 Dernières Épargnes</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Client</th>
                      <th className="px-4 py-3">Projet</th>
                      <th className="px-4 py-3">Objectif / Atteint</th>
                      <th className="px-4 py-3">Progression</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 rounded-r-lg">Date limite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentGoals.map((goal) => (
                      <tr key={goal.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {goal.user?.name || 'Inconnu'}<br/>
                          <span className="text-xs text-muted-foreground">{goal.user?.phone}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-[200px] truncate" title={goal.productName}>
                            {goal.productName || 'Projet libre'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{formatPrice(goal.targetAmount)}</div>
                          <div className="text-xs text-pink-400">Atteint {formatPrice(goal.currentAmount)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold w-8">{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
                            <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div 
                                className="h-full bg-pink-500 rounded-full" 
                                style={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={
                            goal.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            goal.status === 'active' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }>
                            {goal.status === 'completed' ? 'Terminé' :
                             goal.status === 'active' ? 'En cours' : 'Annulé'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('fr-FR') : 'Sans limite'}
                        </td>
                      </tr>
                    ))}
                    {recentGoals.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          Aucune épargne récente
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
