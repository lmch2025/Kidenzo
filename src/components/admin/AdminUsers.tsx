'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, RefreshCw, Shield, Zap, Coins, Flame,
  MousePointerClick, ShoppingCart, Package, Calendar,
  Ban, CheckCircle2, ChevronDown, Award, Star, X,
} from 'lucide-react'
import { formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// ─── Types ──────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  name: string | null
  phone: string
  role: string
  xp: number
  level: number
  coins: number
  streak: number
  clickEarnings: number
  totalValidClicks: number
  totalFraudClicks: number
  createdAt: string
  _count: { ordersAsRecommender: number; recommenderProducts: number }
  isBanned: boolean
}

interface UsersResponse {
  users: AdminUser[]
  total: number
  page: number
  totalPages: number
}

type RoleFilter = '' | 'owner' | 'ambassador' | 'recommender'

// ─── Role config ────────────────────────────────────────────────────

const roleConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  owner: {
    label: 'Propriétaire',
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/30',
    icon: Shield,
  },
  ambassador: {
    label: 'Ambassadeur',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
    icon: Star,
  },
  recommender: {
    label: 'Recommandeur',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    icon: Users,
  },
}

const roleFilterTabs: { id: RoleFilter; label: string }[] = [
  { id: '', label: 'Tous' },
  { id: 'owner', label: 'Propriétaires' },
  { id: 'ambassador', label: 'Ambassadeurs' },
  { id: 'recommender', label: 'Recommandeurs' },
]

// ─── Skeleton ───────────────────────────────────────────────────────

function UserCardSkeleton() {
  return (
    <div className="glass rounded-xl p-4 sm:p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 rounded bg-white/5" />
          <div className="h-3 w-20 rounded bg-white/5" />
        </div>
        <div className="h-5 w-20 rounded-full bg-white/5" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-2.5 w-12 rounded bg-white/5" />
            <div className="h-4 w-16 rounded bg-white/5" />
          </div>
        ))}
      </div>
      <div className="h-3 w-48 rounded bg-white/5 mb-4" />
      <div className="flex gap-2">
        <div className="h-8 flex-1 rounded-lg bg-white/5" />
        <div className="h-8 w-8 rounded-lg bg-white/5" />
        <div className="h-8 w-8 rounded-lg bg-white/5" />
        <div className="h-8 w-8 rounded-lg bg-white/5" />
      </div>
    </div>
  )
}

// ─── Award Popover ──────────────────────────────────────────────────

function AwardPopover({
  type,
  userId,
  onAwarded,
}: {
  type: 'xp' | 'coins'
  userId: string
  onAwarded: () => void
}) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const isXp = type === 'xp'
  const Icon = isXp ? Zap : Coins
  const label = isXp ? 'Octroyer XP' : 'Octroyer Coins'
  const colorClass = isXp ? 'text-orange-400' : 'text-yellow-400'
  const btnGradient = isXp
    ? 'from-orange-500 to-amber-500'
    : 'from-yellow-500 to-amber-500'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseInt(amount)
    if (!numAmount || numAmount <= 0) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isXp ? 'award-xp' : 'award-coins',
          userId,
          amount: numAmount,
          reason: reason || undefined,
        }),
      })
      if (res.ok) {
        setAmount('')
        setReason('')
        setOpen(false)
        onAwarded()
      }
    } catch (err) {
      console.error(`Erreur lors de l'octroi de ${type}:`, err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
            isXp
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20'
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20'
          }`}
          title={label}
        >
          <Icon className="w-3.5 h-3.5" />
        </motion.button>
      </PopoverTrigger>
      <PopoverContent className="w-72 glass-strong border-white/10 p-4" align="end">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-4 h-4 ${colorClass}`} />
            <span className="text-sm font-semibold">{label}</span>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Montant</label>
            <Input
              type="number"
              min={1}
              placeholder={isXp ? 'Ex: 100' : 'Ex: 50'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9 bg-white/5 border-white/10 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Raison (optionnel)</label>
            <Input
              placeholder={isXp ? 'Bonus de performance' : 'Récompense'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 bg-white/5 border-white/10 text-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={!amount || parseInt(amount) <= 0 || isSubmitting}
            className={`w-full h-9 bg-gradient-to-r ${btnGradient} hover:opacity-90 text-white text-xs font-medium border-0`}
          >
            {isSubmitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Award className="w-3.5 h-3.5 mr-1.5" />
                {label}
              </>
            )}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}

// ─── User Card ──────────────────────────────────────────────────────

function UserCard({
  user,
  index,
  onRefresh,
  onBanToggle,
}: {
  user: AdminUser
  index: number
  onRefresh: () => void
  onBanToggle: (userId: string, banned: boolean) => void
}) {
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [isBanning, setIsBanning] = useState(false)
  const [currentRole, setCurrentRole] = useState(user.role)
  const [localBanned, setLocalBanned] = useState(user.isBanned)
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)

  // Sync local banned state with prop changes
  useEffect(() => {
    setLocalBanned(user.isBanned)
  }, [user.isBanned])

  const activeConfig = roleConfig[currentRole] || roleConfig.recommender
  const ActiveIcon = activeConfig.icon
  const displayName = user.name || user.phone
  const displayInitial = displayName.charAt(0).toUpperCase()

  const handleChangeRole = async (newRole: string) => {
    if (newRole === currentRole) {
      setRoleDropdownOpen(false)
      return
    }
    setIsChangingRole(true)
    setRoleDropdownOpen(false)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-user-role',
          userId: user.id,
          role: newRole,
        }),
      })
      if (res.ok) {
        setCurrentRole(newRole)
        onRefresh()
      }
    } catch (err) {
      console.error('Erreur lors du changement de rôle:', err)
    } finally {
      setIsChangingRole(false)
    }
  }

  const handleBanToggle = async () => {
    setIsBanning(true)
    try {
      const newBanned = !localBanned
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ban-user',
          userId: user.id,
          banned: newBanned,
        }),
      })
      if (res.ok) {
        setLocalBanned(newBanned)
        onBanToggle(user.id, newBanned)
        onRefresh()
      }
    } catch (err) {
      console.error('Erreur lors du ban/unban:', err)
    } finally {
      setIsBanning(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`glass rounded-xl p-4 sm:p-5 relative overflow-hidden group ${
        localBanned ? 'ring-1 ring-red-500/30' : ''
      }`}
    >
      {/* Banned overlay */}
      {localBanned && (
        <div className="absolute inset-0 bg-red-500/5 pointer-events-none rounded-xl" />
      )}

      {/* Top gradient line */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
          currentRole === 'owner'
            ? 'from-orange-500 via-amber-500 to-orange-500'
            : currentRole === 'ambassador'
              ? 'from-purple-500 via-violet-500 to-purple-500'
              : 'from-emerald-500 via-teal-500 to-emerald-500'
        }`}
      />

      {/* Header: Avatar + Name + Role */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${activeConfig.bg} ${activeConfig.color} relative`}
        >
          {localBanned ? (
            <Ban className="w-5 h-5 text-red-400" />
          ) : (
            displayInitial
          )}
          {/* Level badge */}
          <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-background">
            {user.level}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate group-hover:text-orange-400 transition-colors">
            {displayName}
          </h3>
          <p className="text-xs text-muted-foreground truncate">{user.phone}</p>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            className={`text-[10px] font-semibold ${activeConfig.bg} ${activeConfig.color} ${activeConfig.border}`}
            variant="outline"
          >
            <ActiveIcon className="w-2.5 h-2.5 mr-1" />
            {activeConfig.label}
          </Badge>
          {localBanned && (
            <Badge className="text-[10px] bg-red-500/15 text-red-400 border-red-500/30" variant="outline">
              Banni
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* XP */}
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-orange-400" />
            XP
          </p>
          <p className="text-sm font-semibold gradient-text">{user.xp.toLocaleString('fr-FR')}</p>
        </div>

        {/* Coins */}
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Coins className="w-2.5 h-2.5 text-yellow-400" />
            Coins
          </p>
          <p className="text-sm font-semibold text-yellow-400">{user.coins.toLocaleString('fr-FR')}</p>
        </div>

        {/* Streak */}
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Flame className="w-2.5 h-2.5 text-red-400" />
            Série
          </p>
          <p className="text-sm font-semibold text-red-400">{user.streak}j</p>
        </div>

        {/* Click Earnings */}
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <MousePointerClick className="w-2.5 h-2.5 text-emerald-400" />
            Gains Clics
          </p>
          <p className="text-sm font-semibold text-emerald-400">{formatPrice(user.clickEarnings)}</p>
        </div>
      </div>

      {/* Click & Order Stats */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
          {user.totalValidClicks} clics valides
        </span>
        <span className="flex items-center gap-1">
          <Ban className="w-2.5 h-2.5 text-red-500" />
          {user.totalFraudClicks} clics fraudes
        </span>
        <span className="flex items-center gap-1">
          <ShoppingCart className="w-2.5 h-2.5 text-blue-400" />
          {user._count.ordersAsRecommender} commande{user._count.ordersAsRecommender !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <Package className="w-2.5 h-2.5 text-purple-400" />
          {user._count.recommenderProducts} produit{user._count.recommenderProducts !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-2.5 h-2.5 text-muted-foreground/60" />
          {new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Change Role Dropdown */}
        <Popover open={roleDropdownOpen} onOpenChange={setRoleDropdownOpen}>
          <PopoverTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isChangingRole}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex-1 disabled:opacity-50"
            >
              {isChangingRole ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                  Changer rôle
                  <ChevronDown className="w-3 h-3 ml-auto text-muted-foreground" />
                </>
              )}
            </motion.button>
          </PopoverTrigger>
          <PopoverContent className="w-48 glass-strong border-white/10 p-1" align="start">
            {(['owner', 'ambassador', 'recommender'] as const).map((role) => {
              const rc = roleConfig[role]
              const RIcon = rc.icon
              const isCurrent = currentRole === role
              return (
                <button
                  key={role}
                  onClick={() => handleChangeRole(role)}
                  disabled={isCurrent}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isCurrent
                      ? `${rc.bg} ${rc.color} cursor-default`
                      : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <RIcon className="w-3.5 h-3.5" />
                  {rc.label}
                  {isCurrent && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                </button>
              )
            })}
          </PopoverContent>
        </Popover>

        {/* Award XP */}
        <AwardPopover type="xp" userId={user.id} onAwarded={onRefresh} />

        {/* Award Coins */}
        <AwardPopover type="coins" userId={user.id} onAwarded={onRefresh} />

        {/* Ban/Unban */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleBanToggle}
          disabled={isBanning}
          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all disabled:opacity-50 ${
            localBanned
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
          }`}
          title={localBanned ? 'Débannir' : 'Bannir'}
        >
          {isBanning ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : localBanned ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <Ban className="w-3.5 h-3.5" />
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('')
  const [isLoading, setIsLoading] = useState(true)
  const limit = 12

  // ─── Fetch users ─────────────────────────────────────────────────

  const fetchUsers = useCallback(async (p: number, s: string, role: RoleFilter) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        action: 'all-users',
        page: p.toString(),
        limit: limit.toString(),
      })
      if (s) params.set('search', s)
      if (role) params.set('role', role)

      const res = await fetch(`/api/admin?${params}`)
      if (res.ok) {
        const data: UsersResponse = await res.json()
        setUsers(data.users)
        setTotal(data.total)
        setPage(data.page)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Initial fetch ───────────────────────────────────────────────

  useEffect(() => {
    fetchUsers(page, search, roleFilter)
  }, [page, search, roleFilter, fetchUsers])

  // ─── Search with debounce ────────────────────────────────────────

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(timeout)
  }, [searchInput])

  // ─── Handlers ────────────────────────────────────────────────────

  const handleRefresh = () => {
    fetchUsers(page, search, roleFilter)
  }

  const handleBanToggle = (userId: string, banned: boolean) => {
    // Optimistically update the user in the list
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isBanned: banned } : u))
    )
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.h2
          className="text-xl font-bold gradient-text-warm flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Users className="w-6 h-6 text-orange-400" />
          Gestion des Utilisateurs
          {total > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              ({total})
            </span>
          )}
        </motion.h2>

        <div className="flex items-center gap-2">
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
      </div>

      {/* Search & Role Filter */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Search */}
        <div className="relative flex-1">
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role filter tabs */}
        <div className="flex gap-1 glass rounded-lg p-1">
          {roleFilterTabs.map((tab) => {
            const isActive = roleFilter === tab.id
            const rc = tab.id ? roleConfig[tab.id] : null
            const TabIcon = rc?.icon || Users
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setRoleFilter(tab.id)
                  setPage(1)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? rc
                      ? `${rc.bg} ${rc.color} border ${rc.border}`
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                <TabIcon className="w-3 h-3" />
                {tab.label}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Users List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}
          </motion.div>
        ) : users.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-orange-400/40" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {search
                ? `Aucun utilisateur ne correspond à "${search}"`
                : roleFilter
                  ? `Aucun ${roleConfig[roleFilter]?.label.toLowerCase() ?? 'utilisateur'} trouvé`
                  : 'Aucun utilisateur inscrit pour le moment'}
            </p>
            {(search || roleFilter) && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
                onClick={() => {
                  setSearchInput('')
                  setSearch('')
                  setRoleFilter('')
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
            className="space-y-3"
          >
            <AnimatePresence>
              {users.map((user, i) => (
                <UserCard
                  key={user.id}
                  user={user}
                  index={i}
                  onRefresh={handleRefresh}
                  onBanToggle={handleBanToggle}
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
          Page {page} sur {totalPages} · {total} utilisateur{total > 1 ? 's' : ''} au total
        </div>
      )}
    </div>
  )
}
