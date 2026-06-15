'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Globe,
  Trophy,
  MousePointerClick,
  Settings,
  Wallet,
  ChevronRight,
} from 'lucide-react'
import dynamic from 'next/dynamic'

const AdminDashboard = dynamic(() => import('./AdminDashboard').then(m => ({ default: m.AdminDashboard })), { ssr: false })
const AdminProducts = dynamic(() => import('./AdminProducts').then(m => ({ default: m.AdminProducts })), { ssr: false })
const AdminOrders = dynamic(() => import('./AdminOrders').then(m => ({ default: m.AdminOrders })), { ssr: false })
const AdminUsers = dynamic(() => import('./AdminUsers').then(m => ({ default: m.AdminUsers })), { ssr: false })
const AdminMiniSites = dynamic(() => import('./AdminMiniSites').then(m => ({ default: m.AdminMiniSites })), { ssr: false })
const AdminGamification = dynamic(() => import('./AdminGamification').then(m => ({ default: m.AdminGamification })), { ssr: false })
const AdminPPC = dynamic(() => import('./AdminPPC').then(m => ({ default: m.AdminPPC })), { ssr: false })
const AdminSystem = dynamic(() => import('./AdminSystem').then(m => ({ default: m.AdminSystem })), { ssr: false })
const AdminWithdrawals = dynamic(() => import('./AdminWithdrawals').then(m => ({ default: m.AdminWithdrawals })), { ssr: false })

export type AdminSection = 'dashboard' | 'products' | 'orders' | 'users' | 'mini-sites' | 'gamification' | 'ppc' | 'withdrawals' | 'system'

interface AdminNavItem {
  id: AdminSection
  label: string
  icon: React.ElementType
  description: string
}

const ADMIN_NAV: AdminNavItem[] = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, description: 'Vue d\'ensemble' },
  { id: 'products', label: 'Produits', icon: Package, description: 'Gestion produits' },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart, description: 'Suivi commandes' },
  { id: 'users', label: 'Utilisateurs', icon: Users, description: 'Gestion utilisateurs' },
  { id: 'mini-sites', label: 'Mini-Sites', icon: Globe, description: 'Sites produits' },
  { id: 'gamification', label: 'Gamification', icon: Trophy, description: 'Badges & Récompenses' },
  { id: 'ppc', label: 'PPC & Anti-Fraude', icon: MousePointerClick, description: 'Clics rémunérés' },
  { id: 'withdrawals', label: 'Retraits', icon: Wallet, description: 'Demandes de retraits' },
  { id: 'system', label: 'Système', icon: Settings, description: 'Configuration' },
]

export function AdminPanel() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <AdminDashboard />
      case 'products': return <AdminProducts />
      case 'orders': return <AdminOrders />
      case 'users': return <AdminUsers />
      case 'mini-sites': return <AdminMiniSites />
      case 'gamification': return <AdminGamification />
      case 'ppc': return <AdminPPC />
      case 'withdrawals': return <AdminWithdrawals />
      case 'system': return <AdminSystem />
      default: return <AdminDashboard />
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold gradient-text-warm">Administration</h2>
          <p className="text-xs text-muted-foreground">Configuration et gestion complète</p>
        </div>
      </motion.div>

      {/* Mobile Horizontal Scroll Tabs */}
      <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {ADMIN_NAV.map((item) => {
          const isActive = activeSection === item.id
          const Icon = item.icon
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSection(item.id)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500/20 via-pink-500/10 to-purple-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </motion.button>
          )
        })}
      </div>

      {/* Desktop: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <nav className="hidden lg:flex flex-col w-52 shrink-0 space-y-1">
          {ADMIN_NAV.map((item) => {
            const isActive = activeSection === item.id
            const Icon = item.icon
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection(item.id)}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left overflow-hidden ${
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="adminNavActive"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 via-pink-500/5 to-purple-500/10 border border-orange-500/20"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="adminNavGlow"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-orange-400 via-pink-400 to-purple-400 shadow-lg shadow-orange-500/30"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={`w-4.5 h-4.5 relative z-10 transition-colors ${isActive ? 'text-orange-400' : ''}`} />
                <span className={`relative z-10 ${isActive ? 'gradient-text-warm font-semibold' : ''}`}>{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-3 h-3 relative z-10 text-orange-400 ml-auto" />
                )}
              </motion.button>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
