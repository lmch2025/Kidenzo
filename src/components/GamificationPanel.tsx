'use client'

import { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Banknote,
  Coins,
  Flame,
  Trophy,
  Target,
  Crown,
  Star,
  Lock,
  CheckCircle2,
  Zap,
  Medal,
  Award,
  TrendingUp,
  Sparkles,
  Gem,
  Shield,
  Rocket,
  Globe,
  Users,
  Bookmark,
  Clover,
  Heart,
  Timer,
  Gift,
  CircleDot,
  ChevronRight,
  PartyPopper,
  ArrowUpRight,
} from 'lucide-react'
import {
  useAppStore,
  getLevelName,
  getLevelColor,
  getRarityColor,
  getRarityGlow,
  getRarityBorder,
  formatPrice,
} from '@/lib/store'
import type {
  GamificationData,
  LeaderboardEntry,
  UserBadgeData,
  UserAchievementData,
  UserDailyQuestData,
  RewardData,
  SpinResult,
} from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'

// ── Badge icon mapping ──────────────────────────────────────────────────────
const BADGE_ICONS: Record<string, React.ReactNode> = {
  star: <Star className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  medal: <Medal className="w-5 h-5" />,
  award: <Award className="w-5 h-5" />,
  trophy: <Trophy className="w-5 h-5" />,
  flame: <Flame className="w-5 h-5" />,
  trending: <TrendingUp className="w-5 h-5" />,
  sparkle: <Sparkles className="w-5 h-5" />,
  target: <Target className="w-5 h-5" />,
  crown: <Crown className="w-5 h-5" />,
  gem: <Gem className="w-5 h-5" />,
  shield: <Shield className="w-5 h-5" />,
  rocket: <Rocket className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  bookmark: <Bookmark className="w-5 h-5" />,
  clover: <Clover className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
}

function getBadgeIcon(iconName: string, size = 'w-5 h-5') {
  const SizeWrapper = ({ children }: { children: React.ReactNode }) => {
    return <span className={size}>{children}</span>
  }
  // Try case-insensitive match
  const key = Object.keys(BADGE_ICONS).find(
    (k) => k.toLowerCase() === iconName.toLowerCase()
  )
  if (key) return BADGE_ICONS[key]
  return <Star className={size} />
}

// ── Animation Variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// ── Spin Wheel Segments ─────────────────────────────────────────────────────
const SPIN_SEGMENTS = [
  { label: '10 XP', xp: 10, coins: 0, color: '#f97316', rarity: 'common' },
  { label: '25 XP', xp: 25, coins: 0, color: '#ec4899', rarity: 'common' },
  { label: '5 Pièces', xp: 0, coins: 5, color: '#a855f7', rarity: 'common' },
  { label: '50 XP', xp: 50, coins: 0, color: '#06b6d4', rarity: 'uncommon' },
  { label: '15 Pièces', xp: 0, coins: 15, color: '#22c55e', rarity: 'uncommon' },
  { label: '100 XP', xp: 100, coins: 0, color: '#ef4444', rarity: 'rare' },
  { label: '50 Pièces', xp: 0, coins: 50, color: '#eab308', rarity: 'epic' },
  { label: '200 XP + 20🪙', xp: 200, coins: 20, color: '#8b5cf6', rarity: 'legendary' },
]

// ── Animated Counter Hook ───────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0)
  const prevTarget = useRef(0)

  useEffect(() => {
    const start = prevTarget.current
    const diff = target - start
    if (diff === 0) return

    const startTime = performance.now()
    let rafId: number

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setCount(Math.round(start + diff * eased))

      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      } else {
        prevTarget.current = target
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])

  return count
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: PROGRESS TAB
// ═══════════════════════════════════════════════════════════════════════════

// ── Animated XP Ring ────────────────────────────────────────────────────────
function XPRing({ data }: { data: GamificationData }) {
  const { user, progress } = data
  const levelColor = getLevelColor(user.level)
  const levelName = getLevelName(user.level)
  const pct = Math.min(progress.levelProgress, 100)

  // SVG circle params
  const size = 180
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  // Gradient color mapping based on level ranges
  const gradientId = 'xp-ring-gradient'
  const glowClass = user.level >= 9 ? 'glow-legendary' : user.level >= 7 ? 'glow-epic' : user.level >= 5 ? 'glow-gold' : ''

  return (
    <motion.div
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className={`relative ${glowClass} rounded-full`}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {user.level >= 9 ? (
                <>
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </>
              ) : user.level >= 7 ? (
                <>
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </>
              ) : user.level >= 5 ? (
                <>
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#ec4899" />
                </>
              ) : user.level >= 3 ? (
                <>
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="50%" stopColor="#a1a1aa" />
                  <stop offset="100%" stopColor="#78716c" />
                </>
              )}
            </linearGradient>
          </defs>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="oklch(0.2 0.03 280)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className={`text-5xl font-black bg-gradient-to-br ${levelColor} bg-clip-text`}
            style={{ WebkitTextFillColor: 'transparent' }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.5 }}
          >
            {user.level}
          </motion.div>
          <motion.div
            className={`text-xs font-semibold bg-gradient-to-r ${levelColor} bg-clip-text mt-0.5`}
            style={{ WebkitTextFillColor: 'transparent' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {levelName}
          </motion.div>
          <motion.div
            className="text-[10px] text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {Math.round(pct)}% → Niveau {user.level + 1}
          </motion.div>
        </div>
      </div>

      {/* XP bar below ring */}
      <div className="w-full max-w-[200px] space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{progress.xpInCurrentLevel} XP</span>
          <span>{progress.xpNeededForNextLevel} XP</span>
        </div>
        <div className="relative h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${levelColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
          />
          <div className="absolute inset-0 rounded-full shimmer" />
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          {user.xp} XP total
        </p>
      </div>
    </motion.div>
  )
}

// ── Stats Grid with Animated Counters ───────────────────────────────────────
function StatsGrid({ data }: { data: GamificationData }) {
  const { stats, user } = data
  const animOrders = useAnimatedCounter(stats.totalOrders)
  const animSales = useAnimatedCounter(Math.round(stats.totalSales / 1000))
  const animCommissions = useAnimatedCounter(Math.round(stats.totalCommissions / 1000))
  const animStreak = useAnimatedCounter(user.streak)

  const statCards = [
    {
      label: 'Total Ventes',
      value: animOrders.toString(),
      icon: <ShoppingBag className="w-5 h-5" />,
      color: 'from-orange-400 to-amber-500',
      bg: 'bg-orange-500/20',
    },
    {
      label: 'Revenus',
      value: formatPrice(animSales * 1000),
      icon: <Banknote className="w-5 h-5" />,
      color: 'from-emerald-400 to-teal-500',
      bg: 'bg-emerald-500/20',
    },
    {
      label: 'Commissions',
      value: formatPrice(animCommissions * 1000),
      icon: <Coins className="w-5 h-5" />,
      color: 'from-amber-400 to-yellow-500',
      bg: 'bg-amber-500/20',
    },
    {
      label: 'Série',
      value: `${animStreak} jour${animStreak !== 1 ? 's' : ''}`,
      icon: <Flame className="w-5 h-5" />,
      color: 'from-rose-400 to-red-500',
      bg: 'bg-rose-500/20',
    },
  ]

  return (
    <motion.div
      className="grid grid-cols-2 gap-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {statCards.map((stat) => (
        <motion.div key={stat.label} variants={itemVariants}>
          <div className="glass rounded-xl p-4 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div
              className={`absolute inset-0 rounded-xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`}
            />
            <div className="relative flex items-start gap-3">
              <div className={`${stat.bg} rounded-lg p-2.5 flex items-center justify-center`}>
                <div className={`bg-gradient-to-br ${stat.color} bg-clip-text`} style={{ WebkitTextFillColor: 'transparent' }}>
                  {stat.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                <p className="text-sm font-bold text-white truncate mt-0.5">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ── Streak Fire ─────────────────────────────────────────────────────────────
function StreakFire({ streak }: { streak: number }) {
  const isActive = streak >= 3
  const isHot = streak >= 7
  const isOnFire = streak >= 14

  return (
    <motion.div
      className="glass rounded-xl p-4 flex items-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className={`relative ${isOnFire ? 'breathe' : isHot ? 'pulse-glow' : isActive ? '' : ''}`}>
        <Flame
          className={`w-10 h-10 ${
            isOnFire
              ? 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]'
              : isHot
                ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]'
                : isActive
                  ? 'text-rose-400'
                  : 'text-gray-500'
          } ${isActive ? 'fire-flicker' : ''}`}
        />
        {isOnFire && (
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </motion.div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-white">{streak}</span>
          <span className="text-sm text-muted-foreground">jour{streak !== 1 ? 's' : ''} de suite</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {isOnFire ? (
            <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 text-[10px] px-2 py-0">
              🔥 Légendaire !
            </Badge>
          ) : isHot ? (
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-[10px] px-2 py-0">
              🔥 En Feu !
            </Badge>
          ) : isActive ? (
            <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 text-[10px] px-2 py-0">
              ✨ Actif
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground">Continuez votre série !</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Progress Tab ────────────────────────────────────────────────────────────
function ProgressTab({ data }: { data: GamificationData }) {
  return (
    <div className="space-y-5">
      <XPRing data={data} />
      <StatsGrid data={data} />
      <StreakFire streak={data.user.streak} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: QUÊTES (DAILY QUESTS) TAB
// ═══════════════════════════════════════════════════════════════════════════

function QuestItem({
  userQuest,
  onClaim,
  isClaiming,
}: {
  userQuest: UserDailyQuestData
  onClaim: (questId: string) => void
  isClaiming: boolean
}) {
  const { quest, progress, completed, claimed } = userQuest
  const pct = quest.threshold > 0 ? Math.min((progress / quest.threshold) * 100, 100) : 0
  const icon = getBadgeIcon(quest.icon, 'w-5 h-5')

  return (
    <motion.div
      className="glass rounded-xl p-4 relative overflow-hidden"
      variants={slideInRight}
      initial="hidden"
      animate="visible"
    >
      {completed && !claimed && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5" />
      )}
      {claimed && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5" />
      )}

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${
            claimed
              ? 'from-emerald-400 to-teal-500'
              : completed
                ? 'from-amber-400 to-orange-500'
                : 'from-slate-400 to-gray-500'
          } flex items-center justify-center text-white flex-shrink-0`}
        >
          {claimed ? <CheckCircle2 className="w-5 h-5" /> : icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-white truncate">{quest.name}</h4>
            {claimed && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px] px-1.5 py-0 flex-shrink-0">
                Réclamé ✓
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{quest.description}</p>

          {/* Progress bar */}
          <div className="mt-2 space-y-1">
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden progress-shine">
              <motion.div
                className={`h-full rounded-full ${
                  claimed
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                    : completed
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                      : 'bg-gradient-to-r from-slate-400 to-gray-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {progress}/{quest.threshold} ({Math.round(pct)}%)
              </span>
              <div className="flex items-center gap-2">
                {quest.xpReward > 0 && (
                  <span className="text-amber-400 font-medium">+{quest.xpReward} XP</span>
                )}
                {quest.coinReward > 0 && (
                  <span className="text-yellow-300 font-medium">+{quest.coinReward} 🪙</span>
                )}
              </div>
            </div>
          </div>

          {/* Claim button */}
          {completed && !claimed && (
            <motion.div className="mt-2" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
              <Button
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 glow-orange text-xs px-4"
                onClick={() => onClaim(userQuest.id)}
                disabled={isClaiming}
              >
                {isClaiming ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </motion.div>
                ) : (
                  <>
                    <Gift className="w-3.5 h-3.5 mr-1" />
                    Réclamer
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function QuestsTab({
  dailyQuests,
  onClaim,
  isClaiming,
}: {
  dailyQuests: UserDailyQuestData[]
  onClaim: (questId: string) => void
  isClaiming: boolean
}) {
  const [timeLeft, setTimeLeft] = useState('')

  // Countdown to midnight
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const daily = dailyQuests.filter((dq) => dq.quest.type === 'daily')
  const weekly = dailyQuests.filter((dq) => dq.quest.type === 'weekly')

  return (
    <div className="space-y-5">
      {/* Countdown timer */}
      <motion.div
        className="glass rounded-xl p-3 flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-orange-400" />
          <span className="text-xs text-muted-foreground">Réinitialisation dans</span>
        </div>
        <span className="text-sm font-mono font-bold gradient-text-warm">{timeLeft}</span>
      </motion.div>

      {/* Daily Quests */}
      {daily.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CircleDot className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Quêtes Quotidiennes</h3>
            <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[10px] px-1.5 py-0">
              {daily.filter((d) => d.claimed).length}/{daily.length}
            </Badge>
          </div>
          <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
            {daily.map((dq) => (
              <QuestItem key={dq.id} userQuest={dq} onClaim={onClaim} isClaiming={isClaiming} />
            ))}
          </motion.div>
        </div>
      )}

      {/* Weekly Quests */}
      {weekly.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Quêtes Hebdomadaires</h3>
            <Badge className="bg-purple-500/20 text-purple-400 border-0 text-[10px] px-1.5 py-0">
              {weekly.filter((w) => w.claimed).length}/{weekly.length}
            </Badge>
          </div>
          <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
            {weekly.map((dq) => (
              <QuestItem key={dq.id} userQuest={dq} onClaim={onClaim} isClaiming={isClaiming} />
            ))}
          </motion.div>
        </div>
      )}

      {dailyQuests.length === 0 && (
        <div className="glass rounded-xl p-6 text-center">
          <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune quête disponible</p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: BADGES COLLECTION TAB
// ═══════════════════════════════════════════════════════════════════════════

function BadgeCard({
  userBadge,
  index,
}: {
  userBadge: UserBadgeData & { earned?: boolean }
  index: number
}) {
  const badge = userBadge.badge
  const earned = userBadge.earned !== false
  const rarityColor = getRarityColor(badge.rarity)
  const rarityGlow = getRarityGlow(badge.rarity)
  const rarityBorder = getRarityBorder(badge.rarity)
  const icon = getBadgeIcon(badge.icon, 'w-6 h-6')

  return (
    <motion.div variants={scaleIn} custom={index}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`relative glass rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-all group ${
              earned
                ? `${rarityBorder} ${rarityGlow}`
                : 'opacity-40 grayscale'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform ${
                earned
                  ? `bg-gradient-to-br ${rarityColor}`
                  : 'bg-gray-700'
              } ${badge.rarity === 'legendary' && earned ? 'breathe' : ''}`}
            >
              {earned ? icon : <Lock className="w-5 h-5" />}
            </div>
            <span className="text-[10px] text-white/80 text-center leading-tight truncate w-full">
              {badge.name}
            </span>
            {/* Rarity indicator dot */}
            {earned && (
              <div
                className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gradient-to-br ${rarityColor}`}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-popover text-popover-foreground border-border max-w-[220px] p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm">{badge.name}</p>
            {earned && (
              <Badge className={`text-[8px] px-1 py-0 bg-gradient-to-r ${rarityColor} text-white border-0`}>
                {badge.rarity}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{badge.description}</p>
          {earned && (
            <div className="flex items-center gap-2 mt-2 text-xs">
              {badge.xpReward > 0 && <span className="text-amber-400">+{badge.xpReward} XP</span>}
              {badge.coinReward > 0 && <span className="text-yellow-300">+{badge.coinReward} 🪙</span>}
            </div>
          )}
          {!earned && (
            <p className="text-xs text-muted-foreground mt-1 italic">Pas encore débloqué</p>
          )}
        </TooltipContent>
      </Tooltip>
    </motion.div>
  )
}

function BadgesTab({ badges }: { badges: (UserBadgeData & { earned?: boolean })[] }) {
  const earned = badges.filter((b) => b.earned !== false)
  const unearned = badges.filter((b) => b.earned === false)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Collection</h3>
        <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-0 px-1.5 py-0">
          {earned.length}/{badges.length}
        </Badge>
      </div>

      {badges.length === 0 ? (
        <div className="glass rounded-xl p-6 text-center">
          <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun badge pour le moment</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {badges.map((userBadge, i) => (
            <BadgeCard key={userBadge.id} userBadge={userBadge} index={i} />
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: SUCCÈS (ACHIEVEMENTS) TAB
// ═══════════════════════════════════════════════════════════════════════════

function AchievementItem({
  achievement,
  index,
}: {
  achievement: UserAchievementData
  index: number
}) {
  const ach = achievement.achievement
  const progressPct = ach.threshold > 0
    ? Math.min((achievement.progress / ach.threshold) * 100, 100)
    : 0
  const rarityColor = getRarityColor(ach.category === 'milestone' ? 'epic' : ach.category === 'sale' ? 'rare' : 'common')
  const icon = getBadgeIcon(ach.icon, 'w-5 h-5')

  return (
    <motion.div
      className={`glass rounded-xl p-4 relative overflow-hidden ${
        achievement.completed ? 'glow-green' : ''
      }`}
      variants={slideInRight}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.06 }}
    >
      {achievement.completed && (
        <div className="absolute inset-0 bg-emerald-500/5" />
      )}

      <div className="relative flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
            achievement.completed
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
              : `bg-gradient-to-br ${rarityColor}`
          }`}
        >
          {achievement.completed ? <CheckCircle2 className="w-5 h-5" /> : icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white truncate">{ach.name}</h4>
            {achievement.completed && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ach.description}</p>

          {/* Progress bar */}
          <div className="mt-2 space-y-1">
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden progress-shine">
              <motion.div
                className={`h-full rounded-full ${
                  achievement.completed
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                    : `bg-gradient-to-r ${rarityColor}`
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 + index * 0.06 }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {achievement.progress}/{ach.threshold}
              </span>
              <div className="flex items-center gap-2">
                {ach.xpReward > 0 && (
                  <span className="text-amber-400 font-medium">+{ach.xpReward} XP</span>
                )}
                {ach.coinReward > 0 && (
                  <span className="text-yellow-300 font-medium">+{ach.coinReward} 🪙</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function AchievementsTab({ achievements }: { achievements: UserAchievementData[] }) {
  const completed = achievements.filter((a) => a.completed)
  const inProgress = achievements.filter((a) => !a.completed)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-white">Succès</h3>
        <Badge className="text-[10px] bg-orange-500/20 text-orange-400 border-0 px-1.5 py-0">
          {completed.length}/{achievements.length}
        </Badge>
      </div>

      {achievements.length === 0 ? (
        <div className="glass rounded-xl p-6 text-center">
          <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun succès disponible</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inProgress.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                En cours ({inProgress.length})
              </h4>
              {inProgress.map((achievement, i) => (
                <AchievementItem key={achievement.id} achievement={achievement} index={i} />
              ))}
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Complétés ({completed.length})
              </h4>
              {completed.map((achievement, i) => (
                <AchievementItem
                  key={achievement.id}
                  achievement={achievement}
                  index={i + inProgress.length}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: BOUTIQUE (REWARD SHOP) TAB
// ═══════════════════════════════════════════════════════════════════════════

function RewardCard({
  reward,
  purchased,
  canAfford,
  onBuy,
  isBuying,
}: {
  reward: RewardData
  purchased: boolean
  canAfford: boolean
  onBuy: (rewardId: string) => void
  isBuying: boolean
}) {
  const rarityColor = getRarityColor(reward.rarity)
  const rarityGlow = getRarityGlow(reward.rarity)
  const rarityBorder = getRarityBorder(reward.rarity)
  const icon = getBadgeIcon(reward.icon, 'w-6 h-6')

  return (
    <motion.div
      className={`glass-card rounded-xl p-4 relative overflow-hidden reward-card ${rarityBorder} ${
        purchased ? 'opacity-60' : ''
      } ${reward.rarity === 'legendary' ? 'breathe' : ''}`}
      variants={scaleIn}
    >
      {purchased && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[9px] px-1.5 py-0">
            Possédé ✓
          </Badge>
        </div>
      )}

      <div className="flex flex-col items-center text-center gap-3">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${
            purchased
              ? 'bg-gray-600'
              : `bg-gradient-to-br ${rarityColor} ${rarityGlow}`
          }`}
        >
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">{reward.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{reward.description}</p>
        </div>

        {/* Coin cost */}
        <div className="flex items-center gap-1">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className={`text-sm font-bold ${canAfford ? 'text-yellow-300' : 'text-red-400'}`}>
            {reward.coinCost}
          </span>
        </div>

        {reward.xpBonus > 0 && (
          <span className="text-xs text-amber-400">+{reward.xpBonus} XP bonus</span>
        )}

        {/* Buy button */}
        {!purchased && (
          <Button
            size="sm"
            className={`w-full text-xs ${
              canAfford
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            onClick={() => onBuy(reward.id)}
            disabled={!canAfford || isBuying}
          >
            {isBuying ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Sparkles className="w-3.5 h-3.5" />
              </motion.div>
            ) : canAfford ? (
              <>
                <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                Acheter
              </>
            ) : (
              'Pas assez de pièces'
            )}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

function BoutiqueTab({
  rewards,
  purchasedRewardIds,
  userCoins,
  onBuy,
  isBuying,
}: {
  rewards: RewardData[]
  purchasedRewardIds: string[]
  userCoins: number
  onBuy: (rewardId: string) => void
  isBuying: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Coin balance */}
      <motion.div
        className="glass rounded-xl p-4 flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
            <Coins className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm text-muted-foreground">Votre solde</span>
        </div>
        <span className="text-xl font-black gradient-text-gold">{userCoins} 🪙</span>
      </motion.div>

      {rewards.length === 0 ? (
        <div className="glass rounded-xl p-6 text-center">
          <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune récompense disponible</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              purchased={purchasedRewardIds.includes(reward.id)}
              canAfford={userCoins >= reward.coinCost}
              onBuy={onBuy}
              isBuying={isBuying}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: ROUE (SPIN WHEEL) TAB
// ═══════════════════════════════════════════════════════════════════════════

function SpinWheelTab({
  userId,
  spinsRemaining,
  onSpinResult,
}: {
  userId: string
  spinsRemaining: number
  onSpinResult: (result: SpinResult & { segmentIndex: number; spinsRemaining: number }) => void
}) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentRotation, setCurrentRotation] = useState(0)
  const wheelRef = useRef<SVGSVGElement>(null)

  const handleSpin = useCallback(async () => {
    if (isSpinning || spinsRemaining <= 0) return
    setIsSpinning(true)

    try {
      const res = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'spin' }),
      })

      if (!res.ok) {
        const err = await res.json()
        console.error('Spin error:', err)
        setIsSpinning(false)
        return
      }

      const data = await res.json()

      // Calculate rotation to land on the selected segment
      const segAngle = 360 / SPIN_SEGMENTS.length
      const targetAngle = 360 - (data.segmentIndex * segAngle + segAngle / 2)
      const fullSpins = 5 + Math.floor(Math.random() * 3) // 5-7 full spins
      const newRotation = currentRotation + fullSpins * 360 + targetAngle

      setCurrentRotation(newRotation)
      // Apply CSS animation
      if (wheelRef.current) {
        wheelRef.current.style.setProperty('--spin-deg', `${newRotation}deg`)
        wheelRef.current.classList.add('wheel-spinning')
      }

      // Wait for animation to complete
      setTimeout(() => {
        if (wheelRef.current) {
          wheelRef.current.classList.remove('wheel-spinning')
          wheelRef.current.style.transform = `rotate(${newRotation}deg)`
        }
        setIsSpinning(false)
        onSpinResult(data)
      }, 4200)
    } catch (err) {
      console.error('Spin error:', err)
      setIsSpinning(false)
    }
  }, [isSpinning, spinsRemaining, userId, currentRotation, onSpinResult])

  // SVG wheel
  const wheelSize = 280
  const center = wheelSize / 2
  const wheelRadius = 120
  const segAngle = 360 / SPIN_SEGMENTS.length

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Spins remaining */}
      <motion.div
        className="glass rounded-xl p-3 flex items-center gap-3 w-full"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
          <CircleDot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Tours restants aujourd&apos;hui</p>
          <p className="text-lg font-bold text-white">
            {spinsRemaining} <span className="text-xs text-muted-foreground">/ 3</span>
          </p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < spinsRemaining
                  ? 'bg-gradient-to-br from-purple-400 to-pink-500'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Wheel */}
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />
        </div>

        <svg
          ref={wheelRef}
          width={wheelSize}
          height={wheelSize}
          viewBox={`0 0 ${wheelSize} ${wheelSize}`}
          className="drop-shadow-2xl"
          style={{ transform: `rotate(${currentRotation}deg)` }}
        >
          {SPIN_SEGMENTS.map((seg, i) => {
            const startAngle = i * segAngle - 90
            const endAngle = (i + 1) * segAngle - 90
            const startRad = (startAngle * Math.PI) / 180
            const endRad = (endAngle * Math.PI) / 180

            const x1 = center + wheelRadius * Math.cos(startRad)
            const y1 = center + wheelRadius * Math.sin(startRad)
            const x2 = center + wheelRadius * Math.cos(endRad)
            const y2 = center + wheelRadius * Math.sin(endRad)

            const midAngle = (startAngle + endAngle) / 2
            const midRad = (midAngle * Math.PI) / 180
            const textR = wheelRadius * 0.65
            const textX = center + textR * Math.cos(midRad)
            const textY = center + textR * Math.sin(midRad)

            const largeArc = segAngle > 180 ? 1 : 0

            return (
              <g key={i}>
                <path
                  d={`M ${center} ${center} L ${x1} ${y1} A ${wheelRadius} ${wheelRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={seg.color}
                  stroke="oklch(0.1 0.02 280)"
                  strokeWidth="2"
                  opacity={0.85}
                />
                <text
                  x={textX}
                  y={textY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="bold"
                  transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {seg.label}
                </text>
              </g>
            )
          })}
          {/* Center circle */}
          <circle cx={center} cy={center} r="22" fill="oklch(0.12 0.04 280)" stroke="oklch(0.3 0.06 280)" strokeWidth="2" />
          <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="11" fontWeight="bold">
            🎯
          </text>
        </svg>
      </div>

      {/* Spin button */}
      <Button
        size="lg"
        className={`w-full max-w-[280px] text-base font-bold ${
          spinsRemaining > 0 && !isSpinning
            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white border-0 glow-purple'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
        onClick={handleSpin}
        disabled={isSpinning || spinsRemaining <= 0}
      >
        {isSpinning ? (
          <motion.div
            className="flex items-center gap-2"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5" />
            Tourne...
          </motion.div>
        ) : spinsRemaining > 0 ? (
          <>
            <PartyPopper className="w-5 h-5 mr-2" />
            Tourner la Roue !
          </>
        ) : (
          'Revenez demain !'
        )}
      </Button>
    </div>
  )
}

// ── Spin Result Dialog ──────────────────────────────────────────────────────
function SpinResultDialog({
  result,
  open,
  onClose,
}: {
  result: (SpinResult & { segmentIndex: number; spinsRemaining: number }) | null
  open: boolean
  onClose: () => void
}) {
  if (!result) return null

  const seg = SPIN_SEGMENTS[result.segmentIndex]
  const isRare = seg.rarity === 'rare' || seg.rarity === 'epic' || seg.rarity === 'legendary'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-[340px] p-0 overflow-hidden">
        <div className="relative p-6 flex flex-col items-center gap-4 text-center">
          {/* Glow background */}
          {isRare && (
            <div
              className={`absolute inset-0 opacity-10 ${
                seg.rarity === 'legendary'
                  ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500'
                  : seg.rarity === 'epic'
                    ? 'bg-gradient-to-br from-purple-400 via-violet-500 to-pink-500'
                    : 'bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500'
              }`}
            />
          )}

          <motion.div
            className="relative z-10"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${
                seg.rarity === 'legendary'
                  ? 'bg-gradient-to-br from-yellow-400 to-amber-600 glow-legendary'
                  : seg.rarity === 'epic'
                    ? 'bg-gradient-to-br from-purple-400 to-pink-600 glow-epic'
                    : seg.rarity === 'rare'
                      ? 'bg-gradient-to-br from-blue-400 to-cyan-600'
                      : 'bg-gradient-to-br from-gray-400 to-gray-600'
              }`}
            >
              {result.xp > 0 ? '⭐' : '🪙'}
            </div>
          </motion.div>

          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-black gradient-text-warm">Félicitations !</h3>
            <div className="mt-2 space-y-1">
              {result.xp > 0 && (
                <p className="text-lg font-bold text-amber-400">+{result.xp} XP</p>
              )}
              {result.coins > 0 && (
                <p className="text-lg font-bold text-yellow-300">+{result.coins} Pièces 🪙</p>
              )}
            </div>
            <Badge
              className={`mt-2 text-[10px] px-2 py-0.5 ${
                seg.rarity === 'legendary'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0'
                  : seg.rarity === 'epic'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0'
                    : seg.rarity === 'rare'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0'
                      : 'bg-gray-600 text-gray-200 border-0'
              }`}
            >
              {seg.rarity.toUpperCase()}
            </Badge>
          </motion.div>

          <motion.div
            className="relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-xs text-muted-foreground">
              Tours restants : {result.spinsRemaining}/3
            </p>
          </motion.div>

          <Button
            className="relative z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 mt-2"
            onClick={onClose}
          >
            Continuer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: CLASSEMENT (LEADERBOARD) TAB
// ═══════════════════════════════════════════════════════════════════════════

function LeaderboardPodium({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) return null

  const podium = entries.slice(0, 3)

  return (
    <div className="flex items-end justify-center gap-3 py-4">
      {/* 2nd place */}
      {podium[1] && (
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-xl mb-1">🥈</div>
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-gray-400/20">
            {podium[1].level}
          </div>
          <div className="mt-1 bg-gradient-to-t from-gray-400/20 to-transparent rounded-t-lg w-20 h-16 flex flex-col items-center justify-end pb-2">
            <span className="text-xs text-white font-semibold truncate max-w-[72px]">
              {podium[1].name || podium[1].phone}
            </span>
            <span className="text-[10px] text-gray-300">{podium[1].xp} XP</span>
          </div>
        </motion.div>
      )}

      {/* 1st place */}
      {podium[0] && (
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Crown className="w-6 h-6 text-amber-400 mb-1" />
          <div className="text-xl mb-0.5">🥇</div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-yellow-500/30">
            {podium[0].level}
          </div>
          <div className="mt-1 bg-gradient-to-t from-amber-500/20 to-transparent rounded-t-lg w-24 h-20 flex flex-col items-center justify-end pb-2">
            <span className="text-xs text-white font-semibold truncate max-w-[88px]">
              {podium[0].name || podium[0].phone}
            </span>
            <span className="text-[10px] text-amber-200">{podium[0].xp} XP</span>
          </div>
        </motion.div>
      )}

      {/* 3rd place */}
      {podium[2] && (
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-xl mb-1">🥉</div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-amber-600/20">
            {podium[2].level}
          </div>
          <div className="mt-1 bg-gradient-to-t from-amber-700/20 to-transparent rounded-t-lg w-20 h-12 flex flex-col items-center justify-end pb-2">
            <span className="text-xs text-white font-semibold truncate max-w-[72px]">
              {podium[2].name || podium[2].phone}
            </span>
            <span className="text-[10px] text-amber-300">{podium[2].xp} XP</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function LeaderboardRow({
  entry,
  isCurrentUser,
  index,
}: {
  entry: LeaderboardEntry
  isCurrentUser: boolean
  index: number
}) {
  const levelColor = getLevelColor(entry.level)
  const levelName = getLevelName(entry.level)

  return (
    <motion.div
      className={`glass rounded-xl p-3 flex items-center gap-3 ${
        isCurrentUser
          ? 'ring-1 ring-orange-500/50 bg-gradient-to-r from-orange-500/10 to-pink-500/10'
          : 'hover:border-white/20'
      } transition-colors`}
      variants={slideInRight}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.05 }}
    >
      {/* Rank */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          entry.rank <= 3
            ? entry.rank === 1
              ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-500/30'
              : entry.rank === 2
                ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-lg shadow-gray-400/30'
                : 'bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-lg shadow-amber-600/30'
            : 'bg-white/10 text-white/60'
        }`}
      >
        {entry.rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate">
            {entry.name || entry.phone}
          </span>
          {isCurrentUser && (
            <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white border-0 text-[10px] px-1.5 py-0">
              Vous
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-xs bg-gradient-to-r ${levelColor} bg-clip-text font-medium`}
            style={{ WebkitTextFillColor: 'transparent' }}
          >
            {levelName}
          </span>
          <span className="text-xs text-muted-foreground">
            {entry.deliveredOrders} vente{entry.deliveredOrders !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-white">{entry.xp}</p>
        <p className="text-xs text-muted-foreground">XP</p>
      </div>
    </motion.div>
  )
}

function ClassementTab({ entries }: { entries: LeaderboardEntry[] }) {
  const user = useAppStore((s) => s.user)

  if (entries.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <Crown className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Aucun classement disponible</p>
      </div>
    )
  }

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Crown className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-white">Classement</h3>
      </div>

      {/* Podium */}
      <LeaderboardPodium entries={top3} />

      <Separator className="bg-white/5" />

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <motion.div
          className="space-y-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {rest.map((entry, i) => (
            <LeaderboardRow
              key={entry.id}
              entry={entry}
              isCurrentUser={user?.id === entry.id}
              index={i}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GAMIFICATION PANEL
// ═══════════════════════════════════════════════════════════════════════════

export default function GamificationPanel() {
  const user = useAppStore((s) => s.user)
  const gamificationData = useAppStore((s) => s.gamificationData)
  const leaderboard = useAppStore((s) => s.leaderboard)
  const rewards = useAppStore((s) => s.rewards)
  const setGamificationData = useAppStore((s) => s.setGamificationData)
  const setLeaderboard = useAppStore((s) => s.setLeaderboard)
  const setRewards = useAppStore((s) => s.setRewards)
  const addXPNotification = useAppStore((s) => s.addXPNotification)
  const triggerConfetti = useAppStore((s) => s.triggerConfetti)
  const showLevelUp = useAppStore((s) => s.showLevelUp)
  const setSpinResult = useAppStore((s) => s.setSpinResult)
  const updateUserXp = useAppStore((s) => s.updateUserXp)
  const updateUserSpins = useAppStore((s) => s.updateUserSpins)

  const [activeTab, setActiveTab] = useState('progress')
  const [isClaiming, setIsClaiming] = useState(false)
  const [isBuying, setIsBuying] = useState(false)
  const [spinResultData, setSpinResultData] = useState<(SpinResult & { segmentIndex: number; spinsRemaining: number }) | null>(null)
  const [showSpinResult, setShowSpinResult] = useState(false)

  // Purchased reward IDs from API
  const [purchasedRewardIds, setPurchasedRewardIds] = useState<string[]>([])
  // Spins remaining (derived from user data)
  const spinsRemaining = useMemo(() => {
    if (!user) return 0
    const lastSpin = user.lastSpinAt ? new Date(user.lastSpinAt) : null
    const now = new Date()
    if (!lastSpin || lastSpin.toDateString() !== now.toDateString()) {
      return 3
    }
    return Math.max(0, 3 - (user.spinsToday || 0))
  }, [user])

  // Fetch gamification data
  const fetchGamificationData = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/gamification?userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setGamificationData(data)
        setPurchasedRewardIds(data.purchasedRewardIds || [])
      }
    } catch (err) {
      console.error('Failed to fetch gamification data:', err)
    }
  }, [user, setGamificationData])

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/gamification?action=leaderboard')
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data.leaderboard || [])
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    }
  }, [setLeaderboard])

  // Fetch rewards
  const fetchRewards = useCallback(async () => {
    try {
      const res = await fetch(`/api/gamification?action=rewards&userId=${user?.id || ''}`)
      if (res.ok) {
        const data = await res.json()
        setRewards(data.rewards || [])
        if (data.purchasedRewardIds) {
          setPurchasedRewardIds(data.purchasedRewardIds)
        }
      }
    } catch (err) {
      console.error('Failed to fetch rewards:', err)
    }
  }, [user, setRewards])

  // Check achievements
  const checkAchievements = useCallback(async () => {
    if (!user?.id) return
    try {
      await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'checkAchievements' }),
      })
      fetchGamificationData()
    } catch (err) {
      console.error('Failed to check achievements:', err)
    }
  }, [user, fetchGamificationData])

  // Claim quest
  const handleClaimQuest = useCallback(async (questId: string) => {
    if (!user?.id) return
    setIsClaiming(true)
    try {
      const res = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'claimQuest', questId }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.xpAwarded) addXPNotification(data.xpAwarded, 'Quête réclamée')
        if (data.leveledUp) {
          showLevelUp(data.newLevel)
          triggerConfetti()
        }
        updateUserXp(data.newXP, data.newLevel, data.newCoins)
        fetchGamificationData()
      }
    } catch (err) {
      console.error('Failed to claim quest:', err)
    } finally {
      setIsClaiming(false)
    }
  }, [user, addXPNotification, showLevelUp, triggerConfetti, updateUserXp, fetchGamificationData])

  // Buy reward
  const handleBuyReward = useCallback(async (rewardId: string) => {
    if (!user?.id) return
    setIsBuying(true)
    try {
      const res = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'buyReward', rewardId }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.xpBonus) addXPNotification(data.xpBonus, 'Bonus récompense')
        if (data.leveledUp) {
          showLevelUp(data.newLevel)
          triggerConfetti()
        }
        updateUserXp(data.newXP, data.newLevel, data.newCoins)
        fetchGamificationData()
        fetchRewards()
      }
    } catch (err) {
      console.error('Failed to buy reward:', err)
    } finally {
      setIsBuying(false)
    }
  }, [user, addXPNotification, showLevelUp, triggerConfetti, updateUserXp, fetchGamificationData, fetchRewards])

  // Handle spin result
  const handleSpinResult = useCallback((result: SpinResult & { segmentIndex: number; spinsRemaining: number; leveledUp?: boolean; newLevel?: number }) => {
    setSpinResultData(result)
    setShowSpinResult(true)
    if (result.xp) addXPNotification(result.xp, 'Roue de la fortune')
    if (result.coins) addXPNotification(result.coins, 'Pièces gagnées')
    if (result.leveledUp && result.newLevel) {
      setTimeout(() => {
        showLevelUp(result.newLevel!)
        triggerConfetti()
      }, 500)
    }
    triggerConfetti()
    // Update the user's spinsToday and lastSpinAt in the store so spinsRemaining recalculates
    const newSpinsToday = 3 - result.spinsRemaining
    updateUserSpins(newSpinsToday, new Date().toISOString())
    // Refresh data from server to get accurate XP/coins/level
    fetchGamificationData()
  }, [addXPNotification, showLevelUp, triggerConfetti, fetchGamificationData, updateUserSpins])

  // Effects
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGamificationData()
  }, [fetchGamificationData])

  useEffect(() => {
    if (activeTab === 'classement') fetchLeaderboard()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeTab === 'boutique') fetchRewards()
  }, [activeTab, fetchLeaderboard, fetchRewards])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAchievements()
  }, [])

  // Loading state
  if (!gamificationData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-8 h-8 text-orange-400" />
        </motion.div>
        <p className="text-sm text-muted-foreground">
          Chargement de vos données...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-white/5 h-auto flex-nowrap overflow-x-auto gap-0.5 p-1 scrollbar-hide">
          <TabsTrigger value="progress" className="flex-shrink-0 min-w-0 text-xs py-2 px-2 sm:px-3 sm:flex-1">
            <ArrowUpRight className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Progrès</span>
          </TabsTrigger>
          <TabsTrigger value="quetes" className="flex-shrink-0 min-w-0 text-xs py-2 px-2 sm:px-3 sm:flex-1">
            <Target className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Quêtes</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex-shrink-0 min-w-0 text-xs py-2 px-2 sm:px-3 sm:flex-1">
            <Medal className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Badges</span>
          </TabsTrigger>
          <TabsTrigger value="succes" className="flex-shrink-0 min-w-0 text-xs py-2 px-2 sm:px-3 sm:flex-1">
            <Trophy className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Succès</span>
          </TabsTrigger>
          <TabsTrigger value="boutique" className="flex-shrink-0 min-w-0 text-xs py-2 px-2 sm:px-3 sm:flex-1">
            <Gift className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Boutique</span>
          </TabsTrigger>
          <TabsTrigger value="roue" className="flex-shrink-0 min-w-0 text-xs py-2 px-2 sm:px-3 sm:flex-1">
            <CircleDot className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Roue</span>
          </TabsTrigger>
          <TabsTrigger value="classement" className="flex-shrink-0 min-w-0 text-xs py-2 px-2 sm:px-3 sm:flex-1">
            <Crown className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Classement</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress">
          <div className="mt-3">
            <ProgressTab data={gamificationData} />
          </div>
        </TabsContent>

        <TabsContent value="quetes">
          <div className="mt-3">
            <ScrollArea className="max-h-[70vh]">
              <QuestsTab
                dailyQuests={gamificationData.dailyQuests || []}
                onClaim={handleClaimQuest}
                isClaiming={isClaiming}
              />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="badges">
          <div className="mt-3">
            <ScrollArea className="max-h-[70vh]">
              <BadgesTab badges={gamificationData.badges || []} />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="succes">
          <div className="mt-3">
            <ScrollArea className="max-h-[70vh]">
              <AchievementsTab achievements={gamificationData.achievements || []} />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="boutique">
          <div className="mt-3">
            <ScrollArea className="max-h-[70vh]">
              <BoutiqueTab
                rewards={rewards}
                purchasedRewardIds={purchasedRewardIds}
                userCoins={gamificationData.user.coins || 0}
                onBuy={handleBuyReward}
                isBuying={isBuying}
              />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="roue">
          <div className="mt-3">
            <SpinWheelTab
              userId={user!.id}
              spinsRemaining={spinsRemaining}
              onSpinResult={handleSpinResult}
            />
          </div>
        </TabsContent>

        <TabsContent value="classement">
          <div className="mt-3">
            <ScrollArea className="max-h-[70vh]">
              <ClassementTab entries={leaderboard} />
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>

      {/* Spin result dialog */}
      <SpinResultDialog
        result={spinResultData}
        open={showSpinResult}
        onClose={() => setShowSpinResult(false)}
      />
    </div>
  )
}
