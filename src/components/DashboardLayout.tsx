'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Share2,
  Users,
  Trophy,
  Crown,
  LogOut,
  LogIn,
  Coins,
  Flame,
  Zap,
  Star,
  Gamepad2,
  BarChart3,
  MousePointerClick,
  Shield,
  Store,
  Menu,
  X,
} from 'lucide-react'
import { useAppStore, getLevelName, getLevelColor } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { DashboardTab, UserRole } from '@/lib/store'

// Dynamic imports for all tab components to reduce initial chunk size
const OverviewTab = dynamic(() => import('@/components/OverviewTab').then(m => ({ default: m.OverviewTab })), {
  ssr: false,
  loading: () => <TabLoadingFallback />,
})
const ProductsTab = dynamic(() => import('@/components/ProductsTab').then(m => ({ default: m.ProductsTab })), {
  ssr: false,
  loading: () => <TabLoadingFallback />,
})
const OrdersTab = dynamic(() => import('@/components/OrdersTab').then(m => ({ default: m.OrdersTab })), {
  ssr: false,
  loading: () => <TabLoadingFallback />,
})
const RecommenderTab = dynamic(() => import('@/components/RecommenderTab').then(m => ({ default: m.RecommenderTab })), {
  ssr: false,
  loading: () => <TabLoadingFallback />,
})
const AmbassadorTab = dynamic(() => import('@/components/AmbassadorTab').then(m => ({ default: m.AmbassadorTab })), {
  ssr: false,
  loading: () => <TabLoadingFallback />,
})
const GamificationPanel = dynamic(() => import('@/components/GamificationPanel'), {
  ssr: false,
  loading: () => <TabLoadingFallback />,
})
const ClicksTab = dynamic(() => import('@/components/ClicksTab').then(m => ({ default: m.ClicksTab })), {
  ssr: false,
  loading: () => <TabLoadingFallback />,
})
const AdminPanel = dynamic(() => import('@/components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })), {
  ssr: false,
  loading: () => <TabLoadingFallback />,
})
const PublicProductsPage = dynamic(() => import('@/components/PublicProductsPage'), { ssr: false })

function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-8 h-8 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
    </div>
  )
}

interface NavItem {
  id: DashboardTab | 'more'
  label: string
  shortLabel?: string
  icon: React.ElementType
  roles: UserRole[]
  section?: string
}

// All navigation items (used by desktop sidebar)
const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: "Vue d'ensemble", shortLabel: 'Accueil', icon: LayoutDashboard, roles: ['owner', 'ambassador', 'recommender'], section: 'principal' },
  { id: 'products', label: 'Produits', icon: Package, roles: ['owner'], section: 'principal' },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart, roles: ['owner', 'ambassador', 'recommender'], section: 'principal' },
  { id: 'clicks', label: 'Clics Rémunérés', shortLabel: 'Clics', icon: MousePointerClick, roles: ['recommender'], section: 'outils' },
  { id: 'recommender', label: 'Recommandeur', icon: Share2, roles: ['recommender'], section: 'outils' },
  { id: 'ambassador', label: 'Ambassadeur', icon: Users, roles: ['ambassador'], section: 'outils' },
  { id: 'admin', label: 'Administration', shortLabel: 'Admin', icon: Shield, roles: ['owner'], section: 'outils' },
  { id: 'gamification', label: 'Succès', icon: Trophy, roles: ['owner', 'ambassador', 'recommender'], section: 'progression' },
  { id: 'leaderboard', label: 'Classement', icon: Crown, roles: ['owner', 'ambassador', 'recommender'], section: 'progression' },
]

// Bottom nav: exactly 5 items per role (4 nav items + 1 "Plus" overflow)
const BOTTOM_NAV_ITEMS: Record<UserRole, Array<NavItem | 'more'>> = {
  owner: [
    { id: 'overview', label: 'Accueil', icon: LayoutDashboard, roles: ['owner'] },
    { id: 'products', label: 'Produits', icon: Package, roles: ['owner'] },
    { id: 'orders', label: 'Commandes', shortLabel: 'Commandes', icon: ShoppingCart, roles: ['owner'] },
    { id: 'gamification', label: 'Succès', icon: Trophy, roles: ['owner'] },
    'more',
  ],
  ambassador: [
    { id: 'overview', label: 'Accueil', icon: LayoutDashboard, roles: ['ambassador'] },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart, roles: ['ambassador'] },
    { id: 'ambassador', label: 'Ambassadeur', shortLabel: 'Ambassadeur', icon: Users, roles: ['ambassador'] },
    { id: 'gamification', label: 'Succès', icon: Trophy, roles: ['ambassador'] },
    'more',
  ],
  recommender: [
    { id: 'overview', label: 'Accueil', icon: LayoutDashboard, roles: ['recommender'] },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart, roles: ['recommender'] },
    { id: 'clicks', label: 'Clics', icon: MousePointerClick, roles: ['recommender'] },
    { id: 'gamification', label: 'Succès', icon: Trophy, roles: ['recommender'] },
    'more',
  ],
}

// Overflow items per role (items NOT in the bottom nav 5)
const OVERFLOW_ITEMS: Record<UserRole, NavItem[]> = {
  owner: [
    { id: 'admin', label: 'Administration', icon: Shield, roles: ['owner'] },
    { id: 'leaderboard', label: 'Classement', icon: Crown, roles: ['owner'] },
  ],
  ambassador: [
    { id: 'leaderboard', label: 'Classement', icon: Crown, roles: ['ambassador'] },
  ],
  recommender: [
    { id: 'recommender', label: 'Recommandeur', icon: Share2, roles: ['recommender'] },
    { id: 'leaderboard', label: 'Classement', icon: Crown, roles: ['recommender'] },
  ],
}

// Visitor nav items
const VISITOR_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: "Accueil", icon: LayoutDashboard, roles: [], section: 'principal' },
  { id: 'products', label: 'Produits', icon: Package, roles: [], section: 'principal' },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart, roles: [], section: 'principal' },
  { id: 'gamification', label: 'Succès', icon: Trophy, roles: [], section: 'progression' },
  { id: 'leaderboard', label: 'Classement', icon: Crown, roles: [], section: 'progression' },
]

const VISITOR_BOTTOM_NAV_ITEMS: Array<NavItem | 'more'> = [
  { id: 'overview', label: 'Accueil', icon: LayoutDashboard, roles: [] },
  { id: 'products', label: 'Produits', icon: Package, roles: [] },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart, roles: [] },
  { id: 'gamification', label: 'Succès', icon: Trophy, roles: [] },
  'more',
]

const VISITOR_OVERFLOW_ITEMS: NavItem[] = [
  { id: 'leaderboard', label: 'Classement', icon: Crown, roles: [] },
]

const TAB_INDEX: Record<DashboardTab, number> = {
  overview: 0,
  products: 1,
  orders: 2,
  clicks: 3,
  recommender: 4,
  ambassador: 5,
  admin: 6,
  gamification: 7,
  leaderboard: 8,
}

const roleBadgeColors: Record<UserRole, string> = {
  owner: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ambassador: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  recommender: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

const roleLabels: Record<UserRole, string> = {
  owner: 'Propriétaire',
  ambassador: 'Ambassadeur',
  recommender: 'Recommandeur',
}

const sectionLabels: Record<string, { label: string; icon: React.ElementType }> = {
  principal: { label: 'Principal', icon: Zap },
  outils: { label: 'Outils', icon: Star },
  progression: { label: 'Progression', icon: Gamepad2 },
}

// Ripple effect component for nav items
function RippleButton({ children, onClick, className }: {
  children: React.ReactNode
  onClick: () => void
  className?: string
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now()
      setRipples((prev) => [...prev, { x, y, id }])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 600)
    }
    onClick()
  }

  return (
    <button ref={buttonRef} onClick={handleClick} className={className}>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/10 animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animationDuration: '0.6s',
            animationIterationCount: '1',
          }}
        />
      ))}
      {children}
    </button>
  )
}

// Slide-up More menu for mobile bottom nav
function MoreMenu({
  isOpen,
  onClose,
  overflowItems,
  onNavigate,
  onLogout,
  onCatalog,
  currentTab,
}: {
  isOpen: boolean
  onClose: () => void
  overflowItems: NavItem[]
  onNavigate: (tab: DashboardTab) => void
  onLogout: () => void
  onCatalog: () => void
  currentTab: DashboardTab
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside tap
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay to avoid the opening click closing immediately
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [isOpen, onClose])

  const handleNavigate = (tab: DashboardTab) => {
    onNavigate(tab)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-[60] md:hidden"
            onClick={onClose}
          />

          {/* Slide-up panel */}
          <motion.div
            ref={menuRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-[70] md:hidden rounded-t-2xl overflow-hidden"
          >
            <div className="glass-strong border-t border-border/50">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Menu items */}
              <div className="px-4 pb-2 space-y-1">
                {overflowItems.map((item) => {
                  const isActive = currentTab === item.id
                  const Icon = item.icon
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleNavigate(item.id as DashboardTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : 'text-foreground hover:bg-white/5 active:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-orange-400 shadow-sm shadow-orange-400/50" />
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {/* Separator */}
              <div className="mx-4 border-t border-border/30" />

              {/* Action items */}
              <div className="px-4 py-2 space-y-1">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onCatalog(); onClose() }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-orange-400 hover:bg-orange-500/5 transition-all"
                >
                  <Store className="w-5 h-5" />
                  <span>Catalogue public</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onLogout(); onClose() }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-red-500/5 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Déconnexion</span>
                </motion.button>
              </div>

              {/* Safe area bottom */}
              <div className="safe-area-bottom" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function DashboardLayout() {
  const { user, isAuthenticated, dashboardTab, setDashboardTab, logout, gamificationData, setCurrentView, setShowAuthModal } = useAppStore()
  const [prevTabIndex, setPrevTabIndex] = useState(0)
  const [progressAnimated, setProgressAnimated] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  const userRole = user?.role as UserRole
  const visibleNavItems = isAuthenticated ? NAV_ITEMS.filter((item) => item.roles.includes(userRole)) : VISITOR_NAV_ITEMS
  const currentTabIndex = TAB_INDEX[dashboardTab] || 0

  // Bottom nav items for this role
  const bottomItems = isAuthenticated ? (BOTTOM_NAV_ITEMS[userRole] || []) : VISITOR_BOTTOM_NAV_ITEMS
  const overflowItems = isAuthenticated ? (OVERFLOW_ITEMS[userRole] || []) : VISITOR_OVERFLOW_ITEMS

  // Check if current tab is in overflow (More menu)
  const isOverflowTab = overflowItems.some(item => item.id === dashboardTab)

  useEffect(() => {
    setPrevTabIndex(currentTabIndex)
  }, [currentTabIndex])

  useEffect(() => {
    const timer = setTimeout(() => setProgressAnimated(true), 300)
    return () => clearTimeout(timer)
  }, [user?.xp])

  const direction = currentTabIndex >= prevTabIndex ? 1 : -1

  const levelProgress = gamificationData?.progress ?? {
    levelProgress: ((user?.xp ?? 0) % 500) / 500 * 100,
    currentLevelXP: ((user?.xp ?? 0) % 500),
    nextLevelXP: 500,
    xpInCurrentLevel: (user?.xp ?? 0) % 500,
    xpNeededForNextLevel: 500 - ((user?.xp ?? 0) % 500),
  }

  // Group nav items by section (for desktop sidebar)
  const sections = visibleNavItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const section = item.section ?? 'principal'
    if (!acc[section]) acc[section] = []
    acc[section].push(item)
    return acc
  }, {})

  const renderTab = () => {
    if (!isAuthenticated) {
      // Pour les visiteurs, seul l'aperçu/catalogue est accessible publiquement via le layout.
      // Les autres clics déclenchent l'authentification.
      if (dashboardTab === 'overview') {
        return <PublicProductsPage />
      }
      return null
    }

    switch (dashboardTab) {
      case 'overview':
        return <OverviewTab />
      case 'products':
        return <ProductsTab />
      case 'orders':
        return <OrdersTab />
      case 'clicks':
        return <ClicksTab />
      case 'recommender':
        return <RecommenderTab />
      case 'ambassador':
        return <AmbassadorTab />
      case 'admin':
        return <AdminPanel />
      case 'gamification':
        return <GamificationPanel />
      case 'leaderboard':
        return <GamificationPanel />
      default:
        return <OverviewTab />
    }
  }

  const handleNavigate = useCallback((tab: DashboardTab) => {
    if (!isAuthenticated && tab !== 'overview') {
      // Redirige le visiteur vers l'authentification s'il clique sur un onglet protégé
      setShowAuthModal(true, 'Connectez-vous pour accéder à cette section')
      setCurrentView('auth')
      return
    }
    setDashboardTab(tab)
    setMoreMenuOpen(false)
  }, [isAuthenticated, setDashboardTab, setShowAuthModal, setCurrentView])

  return (
    <div className="h-[100dvh] flex flex-col bg-background animated-gradient-bg relative overflow-hidden">
      {/* Aurora Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="aurora-blob absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, oklch(0.72 0.22 30 / 40%), transparent 70%)' }}
        />
        <div
          className="aurora-blob-slow absolute top-1/3 -right-48 w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, oklch(0.65 0.2 320 / 35%), transparent 70%)' }}
        />
        <div
          className="aurora-blob absolute -bottom-32 left-1/3 w-[450px] h-[450px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, oklch(0.7 0.18 160 / 30%), transparent 70%)', animationDelay: '-5s' }}
        />
      </div>

      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-glow relative">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 py-3">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text-warm hidden sm:block">Kidenzo</span>
          </motion.div>

          {/* User Info / Login */}
          {isAuthenticated && user ? (
            <motion.div
              className="flex items-center gap-2 sm:gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Streak */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <Flame className="w-3.5 h-3.5 text-red-400 fire-flicker" />
                <span className="text-xs font-bold text-red-400">{user.streak}</span>
              </div>

              {/* Coins */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400">{user.coins}</span>
              </div>

              {/* Level indicator with animated progress */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold bg-gradient-to-r ${getLevelColor(user.level)} bg-clip-text text-transparent`}>
                    {getLevelName(user.level)}
                  </span>
                </div>
                <div className="w-20 relative">
                  <Progress
                    value={progressAnimated ? levelProgress.levelProgress : 0}
                    className="h-1.5 bg-muted transition-all duration-1000 ease-out progress-shine"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {levelProgress.xpInCurrentLevel}/{levelProgress.nextLevelXP}
                </span>
              </div>

              {/* Role badge */}
              <span className={`text-xs px-2 py-0.5 rounded-full border ${roleBadgeColors[userRole]}`}>
                {roleLabels[userRole]}
              </span>

              {/* Name */}
              <span className="text-sm font-medium hidden md:block max-w-[120px] truncate">
                {user.name || user.phone}
              </span>

              {/* Logout */}
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Button
                onClick={() => {
                  setShowAuthModal(true, 'Connectez-vous pour accéder à votre espace')
                  setCurrentView('auth')
                }}
                className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 h-9 px-5"
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                Connexion
              </Button>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex max-w-6xl mx-auto w-full relative z-10">
        {/* Desktop Side Nav */}
        <nav className="hidden md:flex flex-col w-56 shrink-0 p-4 gap-1 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          {Object.entries(sections).map(([sectionKey, items], sectionIdx) => {
            const sectionInfo = sectionLabels[sectionKey]
            return (
              <div key={sectionKey} className={sectionIdx > 0 ? 'mt-4' : ''}>
                {sectionInfo && (
                  <div className="flex items-center gap-2 px-3 mb-2">
                    <sectionInfo.icon className="w-3 h-3 text-muted-foreground/50" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">
                      {sectionInfo.label}
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive = dashboardTab === item.id
                    const Icon = item.icon
                    return (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <RippleButton
                          onClick={() => setDashboardTab(item.id as DashboardTab)}
                          className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left overflow-hidden ${
                            isActive
                              ? 'text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {/* Active background glow */}
                          {isActive && (
                            <motion.div
                              layoutId="sideNavActive"
                              className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 via-pink-500/5 to-purple-500/10 border border-orange-500/20"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}

                          {/* Active left glow bar */}
                          {isActive && (
                            <motion.div
                              layoutId="sideNavGlow"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-orange-400 via-pink-400 to-purple-400 shadow-lg shadow-orange-500/30"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            >
                              <div className="absolute inset-0 rounded-r-full bg-gradient-to-b from-orange-400 via-pink-400 to-purple-400 blur-sm opacity-50" />
                            </motion.div>
                          )}

                          <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-orange-400' : ''}`} />
                          <span className={`relative z-10 transition-colors ${isActive ? 'gradient-text-warm font-semibold' : ''}`}>
                            {item.label}
                          </span>
                        </RippleButton>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Bottom Actions */}
          <div className="mt-auto pt-4 space-y-1">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setDashboardTab('overview')
              }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-orange-400 hover:bg-orange-500/5 transition-all w-full"
            >
              <Store className="w-5 h-5" />
              <span>Catalogue public</span>
            </motion.button>
            {isAuthenticated ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={logout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-red-500/5 transition-all w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Déconnexion</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowAuthModal(true, 'Connectez-vous pour accéder à votre espace')
                  setCurrentView('auth')
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-orange-400 hover:bg-orange-500/5 transition-all w-full"
              >
                <LogIn className="w-5 h-5" />
                <span>Connexion</span>
              </motion.button>
            )}
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1 p-4 pb-28 md:pb-4 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={dashboardTab}
              initial={{ opacity: 0, x: direction * 40, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: direction * -40, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav - Exactly 5 items */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="glass-strong border-t border-border/50">
          <div className="flex items-center justify-around safe-area-bottom">
            {bottomItems.map((item, index) => {
              if (item === 'more') {
                // "Plus" overflow button
                const isMoreActive = isOverflowTab || moreMenuOpen
                return (
                  <motion.button
                    key="more"
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    className="relative flex flex-col items-center justify-center py-2 px-2 min-w-[56px] min-h-[52px] transition-all"
                  >
                    {/* Glowing dot above active tab */}
                    {isMoreActive && (
                      <motion.div
                        layoutId="mobileNavDot"
                        className="absolute top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 shadow-lg shadow-orange-400/50"
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 blur-md opacity-60" />
                      </motion.div>
                    )}

                    <motion.div
                      animate={{
                        scale: isMoreActive ? 1.1 : 1,
                        y: isMoreActive ? -2 : 0,
                        rotate: moreMenuOpen ? 180 : 0,
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      {moreMenuOpen ? (
                        <X className={`w-5 h-5 transition-colors ${isMoreActive ? 'text-orange-400' : 'text-muted-foreground'}`} />
                      ) : (
                        <Menu className={`w-5 h-5 transition-colors ${isMoreActive ? 'text-orange-400' : 'text-muted-foreground'}`} />
                      )}
                    </motion.div>
                    <span className={`text-[10px] leading-tight transition-colors mt-0.5 ${
                      isMoreActive ? 'text-orange-400 font-semibold' : 'text-muted-foreground'
                    }`}>
                      Plus
                    </span>

                    {/* Active background pill */}
                    {isMoreActive && (
                      <motion.div
                        layoutId="mobileNavPill"
                        className="absolute inset-x-0.5 top-0 bottom-0 rounded-xl bg-orange-500/5 -z-10"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </motion.button>
                )
              }

              // Normal nav item
              const navItem = item as NavItem
              const isActive = dashboardTab === navItem.id
              const Icon = navItem.icon
              const displayLabel = navItem.shortLabel || navItem.label

              return (
                <motion.button
                  key={navItem.id}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleNavigate(navItem.id as DashboardTab)}
                  className="relative flex flex-col items-center justify-center py-2 px-2 min-w-[56px] min-h-[52px] transition-all"
                >
                  {/* Glowing dot above active tab */}
                  {isActive && (
                    <motion.div
                      layoutId="mobileNavDot"
                      className="absolute top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 shadow-lg shadow-orange-400/50"
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 blur-md opacity-60" />
                    </motion.div>
                  )}

                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -2 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-orange-400' : 'text-muted-foreground'}`} />
                  </motion.div>
                  <span className={`text-[10px] leading-tight transition-colors mt-0.5 ${
                    isActive ? 'text-orange-400 font-semibold' : 'text-muted-foreground'
                  }`}>
                    {displayLabel}
                  </span>

                  {/* Active background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="mobileNavPill"
                      className="absolute inset-x-0.5 top-0 bottom-0 rounded-xl bg-orange-500/5 -z-10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* More Menu Overlay */}
      <MoreMenu
        isOpen={moreMenuOpen}
        onClose={() => setMoreMenuOpen(false)}
        overflowItems={overflowItems}
        onNavigate={handleNavigate}
        onLogout={logout}
        onCatalog={() => setCurrentView('public')}
        currentTab={dashboardTab}
      />
    </div>
  )
}
