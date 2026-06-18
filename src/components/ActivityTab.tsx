'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type UserRole, type ActivitySubTab } from '@/lib/store'
import { ShoppingCart, Coins, MousePointerClick, Share2, Users, Crown } from 'lucide-react'

import { OrdersTab } from './OrdersTab'
import { WalletTab } from './WalletTab'
import { ClicksTab } from './ClicksTab'
import { RecommenderTab } from './RecommenderTab'
import { AmbassadorTab } from './AmbassadorTab'

interface TabConfig {
  id: ActivitySubTab
  label: string
  icon: React.ElementType
  color: string
}

export function ActivityTab() {
  const { user, activitySubTab, setActivitySubTab } = useAppStore()
  const role = user?.role as UserRole
  
  const activeTab = activitySubTab
  const setActiveTab = setActivitySubTab

  const availableTabs: TabConfig[] = [
    { id: 'orders', label: 'Commandes', icon: ShoppingCart, color: 'text-blue-400' },
    { id: 'wallet', label: 'Portefeuille', icon: Coins, color: 'text-yellow-400' },
  ]

  if (role === 'recommender') {
    availableTabs.push(
      { id: 'clicks', label: 'Clics', icon: MousePointerClick, color: 'text-emerald-400' },
      { id: 'recommender', label: 'Réseau', icon: Share2, color: 'text-purple-400' }
    )
  } else if (role === 'ambassador' || role === 'super_admin' || role === 'admin' || role === 'owner') {
    availableTabs.push(
      { id: 'ambassador', label: 'Réseau Pro', icon: Crown, color: 'text-yellow-400' }
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'orders': return <OrdersTab />
      case 'wallet': return <WalletTab />
      case 'clicks': return <ClicksTab />
      case 'recommender': return <RecommenderTab />
      case 'ambassador': return <AmbassadorTab />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>Mon Activité</span>
        </h2>
        <p className="text-sm text-white/50">Gérez vos commandes, vos gains et votre réseau</p>
      </div>

      {/* Tabs Menu - Big Touch-Friendly Buttons */}
      <div className={`grid gap-3 ${availableTabs.length > 2 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
        {availableTabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${
                isActive 
                  ? 'bg-white/10 border-white/20 shadow-lg' 
                  : 'bg-white/5 border-white/5 hover:bg-white/[0.07]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activityTabActiveGlow"
                  className="absolute inset-0 rounded-2xl border border-orange-500/30"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`p-2 rounded-xl ${isActive ? 'bg-white/10' : 'bg-white/5'}`}>
                <Icon className={`w-6 h-6 ${tab.color}`} />
              </div>
              <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-white/60'}`}>
                {tab.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
