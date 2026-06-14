import { create } from 'zustand'

export type UserRole = 'owner' | 'ambassador' | 'recommender'

export interface User {
  id: string
  phone: string
  name: string | null
  avatar: string | null
  role: UserRole
  ambassadorId: string | null
  xp: number
  level: number
  coins: number
  streak: number
  bestStreak: number
  spinsToday: number
  lastSpinAt: string | null
  lastActiveAt: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  ownerId: string
  name: string
  description: string
  basePrice: number
  category: string
  stock: number
  status: string
  maxCommission: number
  weight: string
  dimensions: string
  sourceUrl: string | null
  createdAt: string
  images?: ProductImage[]
  miniSite?: MiniSite | null
}

export interface ImportProductResult {
  name: string
  description: string
  price: number
  images: string[]
  category: string
  weight: string
  dimensions: string
  sourceUrl: string
}

export interface ProductImage {
  id: string
  storageUrl: string
  position: number
}

export interface MiniSite {
  id: string
  productId: string
  slug: string
  createdAt: string
  product?: Product
}

export interface RecommenderProduct {
  id: string
  recommenderId: string
  miniSiteId: string
  commissionPct: number
  visits: number
  createdAt: string
  updatedAt: string
  miniSite?: MiniSite & { product?: Product }
}

export interface Order {
  id: string
  miniSiteId: string
  recommenderId: string | null
  customerName: string
  customerPhone: string
  customerAddress: string
  customerMessage: string | null
  finalPrice: number
  commissionRecommender: number
  commissionAmbassador: number
  status: string
  createdAt: string
  updatedAt: string
  miniSite?: MiniSite & { product?: Product }
}

export interface BadgeData {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  threshold: number
  xpReward: number
  coinReward: number
}

export interface UserBadgeData {
  id: string
  badge: BadgeData
  earnedAt: string
}

export interface AchievementData {
  id: string
  name: string
  description: string
  icon: string
  category: string
  threshold: number
  xpReward: number
  coinReward: number
}

export interface UserAchievementData {
  id: string
  achievement: AchievementData
  progress: number
  completed: boolean
  completedAt: string | null
}

export interface DailyQuestData {
  id: string
  name: string
  description: string
  icon: string
  category: string
  type: string
  threshold: number
  xpReward: number
  coinReward: number
}

export interface UserDailyQuestData {
  id: string
  quest: DailyQuestData
  progress: number
  completed: boolean
  claimed: boolean
  assignedAt: string
  expiresAt: string
}

export interface RewardData {
  id: string
  name: string
  description: string
  icon: string
  category: string
  coinCost: number
  xpBonus: number
  rarity: string
}

export interface SpinResult {
  xp: number
  coins: number
  label: string
  color: string
}

export interface GamificationProgress {
  levelProgress: number
  currentLevelXP: number
  nextLevelXP: number
  xpInCurrentLevel: number
  xpNeededForNextLevel: number
}

export interface GamificationStats {
  totalOrders: number
  totalSales: number
  totalCommissions: number
}

export interface GamificationData {
  user: Pick<User, 'id' | 'name' | 'phone' | 'role' | 'xp' | 'level' | 'coins' | 'streak' | 'bestStreak' | 'lastActiveAt'>
  badges: UserBadgeData[]
  achievements: UserAchievementData[]
  dailyQuests: UserDailyQuestData[]
  progress: GamificationProgress
  stats: GamificationStats
}

export interface LeaderboardEntry {
  rank: number
  id: string
  name: string | null
  phone: string
  role: string
  xp: number
  level: number
  streak: number
  deliveredOrders: number
}

export interface XPNotification {
  id: string
  amount: number
  reason: string
  timestamp: number
}

export interface ClickStats {
  user: {
    id: string
    clickEarnings: number
    totalValidClicks: number
    totalFraudClicks: number
  }
  today: {
    validClicks: number
    fraudClicks: number
    earnings: number
  }
  dailyEarnings: Record<string, { valid: number; fraud: number; earnings: number }>
  recentClicks: Array<{
    id: string
    miniSiteId: string
    earnings: number
    isVerified: boolean
    isFraud: boolean
    fraudScore: number
    deviceType: string
    browserName: string
    country: string
    createdAt: string
  }>
  deviceBreakdown: Array<{ device: string; count: number }>
}

export interface PPCConfig {
  id: string
  ratePerClick: number
  maxClicksPerIpPerDay: number
  maxClicksPerFingerprint: number
  minClickIntervalMs: number
  maxClicksPerRecommender: number
  fraudScoreThreshold: number
  autoBlockEnabled: boolean
  velocityWindowMinutes: number
  maxClicksInVelocityWindow: number
  requireVerification: boolean
  active: boolean
  updatedAt: string
}

export interface SuspiciousActivityData {
  id: string
  recommender: {
    id: string
    name: string | null
    phone: string
    role: string
    totalFraudClicks: number
    clickEarnings: number
  }
  activityType: string
  severity: string
  description: string
  metadata: string
  isResolved: boolean
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
}

export type AppView = 'public' | 'auth' | 'dashboard' | 'mini-site'
export type DashboardTab = 'overview' | 'products' | 'orders' | 'recommender' | 'ambassador' | 'gamification' | 'leaderboard' | 'clicks' | 'admin'

// Pending action that survives auth redirect
export interface PendingRecommendAction {
  productId: string
  miniSiteId: string
  commissionPct: number
  timestamp: number
}

interface AppState {
  // Auth
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAuthLoading: boolean

  // Navigation
  currentView: AppView
  dashboardTab: DashboardTab
  miniSiteSlug: string | null
  showAuthModal: boolean
  authModalReason: string | null

  // Pending action (survives auth redirect)
  pendingAction: PendingRecommendAction | null

  // Public data
  publicProducts: Product[]

  // Data
  products: Product[]
  recommenderProducts: RecommenderProduct[]
  orders: Order[]
  gamificationData: GamificationData | null
  leaderboard: LeaderboardEntry[]
  rewards: RewardData[]
  clickStats: ClickStats | null
  ppcConfig: PPCConfig | null

  // UI
  isLoading: boolean
  xpNotifications: XPNotification[]
  showConfetti: boolean
  levelUpAnimation: { show: boolean; level: number } | null
  spinResult: SpinResult | null

  // Actions
  setUser: (user: User | null, token: string | null) => void
  logout: () => void
  setAuthLoading: (loading: boolean) => void
  setCurrentView: (view: AppView) => void
  setDashboardTab: (tab: DashboardTab) => void
  setMiniSiteSlug: (slug: string | null) => void
  setShowAuthModal: (show: boolean, reason?: string | null) => void
  setPendingAction: (action: PendingRecommendAction | null) => void
  clearPendingAction: () => void
  setPublicProducts: (products: Product[]) => void
  setProducts: (products: Product[]) => void
  addProduct: (product: Product) => void
  updateProductInList: (product: Product) => void
  setRecommenderProducts: (products: RecommenderProduct[]) => void
  setOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrderInList: (order: Order) => void
  setGamificationData: (data: GamificationData | null) => void
  setLeaderboard: (entries: LeaderboardEntry[]) => void
  setRewards: (rewards: RewardData[]) => void
  setClickStats: (stats: ClickStats | null) => void
  setPPCConfig: (config: PPCConfig | null) => void
  setLoading: (loading: boolean) => void
  addXPNotification: (amount: number, reason: string) => void
  removeXPNotification: (id: string) => void
  triggerConfetti: () => void
  showLevelUp: (level: number) => void
  hideLevelUp: () => void
  setSpinResult: (result: SpinResult | null) => void
  updateUserXp: (xp: number, level: number, coins: number) => void
  updateUserSpins: (spinsToday: number, lastSpinAt: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  token: null,
  isAuthenticated: false,
  isAuthLoading: false,

  // Navigation
  currentView: 'public',
  dashboardTab: 'overview',
  miniSiteSlug: null,
  showAuthModal: false,
  authModalReason: null,

  // Pending action
  pendingAction: null,

  // Public data
  publicProducts: [],

  // Data
  products: [],
  recommenderProducts: [],
  orders: [],
  gamificationData: null,
  leaderboard: [],
  rewards: [],
  clickStats: null,
  ppcConfig: null,

  // UI
  isLoading: false,
  xpNotifications: [],
  showConfetti: false,
  levelUpAnimation: null,
  spinResult: null,

  // Actions
  setUser: (user, token) =>
    set((state) => ({
      user,
      token,
      isAuthenticated: !!user,
      isAuthLoading: false,
      // If there's a pending action, stay on public view so the action can be resumed
      // Otherwise navigate to dashboard as usual
      currentView: user
        ? (state.pendingAction ? state.currentView : 'dashboard')
        : 'public',
    })),

  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      currentView: 'public',
      dashboardTab: 'overview',
      products: [],
      recommenderProducts: [],
      orders: [],
      gamificationData: null,
      clickStats: null,
      showAuthModal: false,
      authModalReason: null,
      pendingAction: null,
    }),

  setAuthLoading: (loading) => set({ isAuthLoading: loading }),

  setCurrentView: (view) => set({ currentView: view }),

  setDashboardTab: (tab) => set({ dashboardTab: tab }),

  setMiniSiteSlug: (slug) => set({ miniSiteSlug: slug, currentView: slug ? 'mini-site' : 'public' }),

  setShowAuthModal: (show, reason) => set({ showAuthModal: show, authModalReason: reason || null }),

  setPendingAction: (action) => set({ pendingAction: action }),

  clearPendingAction: () => set({ pendingAction: null }),

  setPublicProducts: (products) => set({ publicProducts: products }),

  setProducts: (products) => set({ products }),

  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),

  updateProductInList: (product) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === product.id ? product : p)),
    })),

  setRecommenderProducts: (products) => set({ recommenderProducts: products }),

  setOrders: (orders) => set({ orders }),

  addOrder: (order) =>
    set((state) => ({ orders: [...state.orders, order] })),

  updateOrderInList: (order) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === order.id ? order : o)),
    })),

  setGamificationData: (data) => set({ gamificationData: data }),

  setLeaderboard: (entries) => set({ leaderboard: entries }),

  setRewards: (rewards) => set({ rewards }),

  setClickStats: (stats) => set({ clickStats: stats }),

  setPPCConfig: (config) => set({ ppcConfig: config }),

  setLoading: (loading) => set({ isLoading: loading }),

  addXPNotification: (amount, reason) => {
    const id = Math.random().toString(36).substr(2, 9)
    set((state) => ({
      xpNotifications: [...state.xpNotifications, { id, amount, reason, timestamp: Date.now() }],
    }))
    setTimeout(() => {
      set((state) => ({
        xpNotifications: state.xpNotifications.filter((n) => n.id !== id),
      }))
    }, 2500)
  },

  removeXPNotification: (id) =>
    set((state) => ({
      xpNotifications: state.xpNotifications.filter((n) => n.id !== id),
    })),

  triggerConfetti: () => {
    set({ showConfetti: true })
    setTimeout(() => set({ showConfetti: false }), 3000)
  },

  showLevelUp: (level) => {
    set({ levelUpAnimation: { show: true, level } })
    setTimeout(() => set({ levelUpAnimation: null }), 3500)
  },

  hideLevelUp: () => set({ levelUpAnimation: null }),

  setSpinResult: (result) => set({ spinResult: result }),

  updateUserXp: (xp, level, coins) =>
    set((state) => ({
      user: state.user ? { ...state.user, xp, level, coins } : null,
      gamificationData: state.gamificationData
        ? {
            ...state.gamificationData,
            user: { ...state.gamificationData.user, xp, level, coins },
          }
        : null,
    })),

  updateUserSpins: (spinsToday, lastSpinAt) =>
    set((state) => ({
      user: state.user ? { ...state.user, spinsToday, lastSpinAt } : null,
    })),
}))

// Level names in French
export const LEVEL_NAMES: Record<number, string> = {
  1: 'Débutant',
  2: 'Apprenti',
  3: 'Commercial',
  4: 'Expert',
  5: 'Maître',
  6: 'Champion',
  7: 'Légende',
  8: 'Titan',
  9: 'Suprême',
  10: 'Divin',
}

export function getLevelName(level: number): string {
  if (level >= 10) return 'Divin'
  return LEVEL_NAMES[level] || `Niveau ${level}`
}

export function getLevelColor(level: number): string {
  if (level >= 9) return 'from-yellow-400 via-amber-300 to-yellow-500'
  if (level >= 7) return 'from-purple-400 via-pink-400 to-rose-400'
  if (level >= 5) return 'from-orange-400 via-red-400 to-pink-400'
  if (level >= 3) return 'from-emerald-400 via-teal-400 to-cyan-400'
  return 'from-slate-400 via-zinc-400 to-gray-400'
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'legendary': return 'from-yellow-400 via-amber-400 to-orange-400'
    case 'epic': return 'from-purple-400 via-violet-400 to-pink-400'
    case 'rare': return 'from-blue-400 via-cyan-400 to-teal-400'
    default: return 'from-gray-400 via-slate-400 to-zinc-400'
  }
}

export function getRarityGlow(rarity: string): string {
  switch (rarity) {
    case 'legendary': return 'shadow-yellow-500/40 shadow-lg'
    case 'epic': return 'shadow-purple-500/40 shadow-lg'
    case 'rare': return 'shadow-blue-500/30 shadow-md'
    default: return ''
  }
}

export function getRarityBorder(rarity: string): string {
  switch (rarity) {
    case 'legendary': return 'border-yellow-500/40'
    case 'epic': return 'border-purple-500/40'
    case 'rare': return 'border-blue-500/30'
    default: return 'border-white/10'
  }
}

// Format currency (FCFA)
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}
