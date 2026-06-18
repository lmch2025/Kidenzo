'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Store,
  Zap,
  Trophy,
  User,
  Flame,
  Coins,
  LogIn
} from 'lucide-react'
import { useAppStore, getLevelName, getLevelColor, type DashboardTab, type UserRole } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

// Dynamic imports for all tab components
const OverviewTab = dynamic(() => import('@/components/OverviewTab').then(m => ({ default: m.OverviewTab })), { ssr: false, loading: () => <TabLoadingFallback /> })
const ActivityTab = dynamic(() => import('@/components/ActivityTab').then(m => ({ default: m.ActivityTab })), { ssr: false, loading: () => <TabLoadingFallback /> })
const GamificationPanel = dynamic(() => import('@/components/GamificationPanel'), { ssr: false, loading: () => <TabLoadingFallback /> })
const ProfileTab = dynamic(() => import('@/components/ProfileTab').then(m => ({ default: m.ProfileTab })), { ssr: false, loading: () => <TabLoadingFallback /> })
const PublicProductsPage = dynamic(() => import('@/components/PublicProductsPage'), { ssr: false, loading: () => <TabLoadingFallback /> })

function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-8 h-8 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
    </div>
  )
}

interface NavItem {
  id: DashboardTab
  label: string
  icon: React.ElementType
  requiresAuth: boolean
}

// Exactly 5 navigation items for all roles
const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Accueil', icon: LayoutDashboard, requiresAuth: false },
  { id: 'catalog', label: 'Boutique', icon: Store, requiresAuth: false },
  { id: 'activity', label: 'Activité', icon: Zap, requiresAuth: true },
  { id: 'gamification', label: 'Succès', icon: Trophy, requiresAuth: false },
  { id: 'profile', label: 'Profil', icon: User, requiresAuth: true },
]

const TAB_INDEX: Record<DashboardTab, number> = {
  overview: 0,
  catalog: 1,
  activity: 2,
  gamification: 3,
  profile: 4,
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

export function DashboardLayout() {
  const { user, isAuthenticated, dashboardTab, setDashboardTab, setCurrentView, setShowAuthModal, gamificationData } = useAppStore()
  const [prevTabIndex, setPrevTabIndex] = useState(0)
  const [progressAnimated, setProgressAnimated] = useState(false)

  const currentTabIndex = TAB_INDEX[dashboardTab] || 0
  const userRole = user?.role as UserRole | undefined

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

  const roleBadgeColors: Record<string, string> = {
    owner: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    ambassador: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    recommender: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  }

  const roleLabels: Record<string, string> = {
    owner: 'Propriétaire',
    ambassador: 'Ambassadeur',
    recommender: 'Recommandeur',
  }

  const handleNavigate = useCallback((item: NavItem) => {
    if (!isAuthenticated && item.requiresAuth) {
      setShowAuthModal(true, 'Connectez-vous pour accéder à cette section')
      setCurrentView('auth')
      return
    }
    setDashboardTab(item.id)
  }, [isAuthenticated, setDashboardTab, setShowAuthModal, setCurrentView])

  const renderTab = () => {
    switch (dashboardTab) {
      case 'overview': return <OverviewTab />
      case 'catalog': return <PublicProductsPage />
      case 'activity': return isAuthenticated ? <ActivityTab /> : <OverviewTab />
      case 'gamification': return <GamificationPanel initialTab="succes" />
      case 'profile': return isAuthenticated ? <ProfileTab /> : <OverviewTab />
      default: return <OverviewTab />
    }
  }

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
            className="flex flex-col items-center justify-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src="/icon.png" 
              alt="Kidenzo Logo" 
              className="w-8 h-8 object-contain drop-shadow-md" 
            />
            <span className="font-bold text-[10px] tracking-wide gradient-text-warm -mt-1">Kidenzo</span>
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

              {/* Level indicator */}
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
              </div>

              {/* Role badge */}
              {userRole && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${roleBadgeColors[userRole]}`}>
                  {roleLabels[userRole]}
                </span>
              )}

              {/* Name */}
              <span className="text-sm font-medium hidden md:block max-w-[120px] truncate">
                {user.name || user.phone}
              </span>
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
      <div className="flex-1 flex max-w-6xl mx-auto w-full relative z-10 min-h-0">
        {/* Desktop Side Nav */}
        {isAuthenticated && (
          <nav className="hidden md:flex flex-col w-56 shrink-0 p-4 gap-1 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = dashboardTab === item.id
              const Icon = item.icon
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RippleButton
                    onClick={() => handleNavigate(item)}
                    className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left overflow-hidden ${
                      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sideNavActive"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 via-pink-500/5 to-purple-500/10 border border-orange-500/20"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
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
        </nav>
        )}

        {/* Content Area */}
        <main className={`flex-1 p-4 ${isAuthenticated ? 'pb-28 md:pb-4' : 'pb-4'} overflow-y-auto`}>
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
      {isAuthenticated && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="glass-strong border-t border-border/50">
          <div className="flex items-center justify-around safe-area-bottom">
            {NAV_ITEMS.map((item) => {
              const isActive = dashboardTab === item.id
              const Icon = item.icon

              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleNavigate(item)}
                  className="relative flex flex-col items-center justify-center py-2 px-1 min-w-[56px] min-h-[52px] transition-all flex-1"
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
                    {item.label}
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
      )}
    </div>
  )
}
