'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type UserRole, getLevelName, getLevelColor } from '@/lib/store'
import { LogOut, User, Shield, ChevronLeft, Package, Crown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminPanel } from '@/components/admin/AdminPanel'

export function ProfileTab() {
  const { user, logout, updateUserRole } = useAppStore()
  const role = user?.role as UserRole
  const [showAdmin, setShowAdmin] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)

  const handleUpgrade = async () => {
    if (!user) return
    setIsUpgrading(true)
    try {
      const res = await fetch('/api/user/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      if (res.ok) {
        updateUserRole('ambassador')
        setUpgradeSuccess(true)
      }
    } catch (error) {
      console.error('Upgrade failed:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  if (!user) return null

  if (showAdmin && (role === 'owner' || role === 'admin_neolife')) {
    return (
      <div className="space-y-4 relative">
        <div className="sticky top-0 z-50 bg-[#0a0118]/90 backdrop-blur-xl py-4 -mx-4 px-4 border-b border-white/10 mb-6">
          <Button
            variant="ghost"
            onClick={() => setShowAdmin(false)}
            className="text-white/90 hover:text-white font-medium bg-white/5"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Retour au Profil
          </Button>
        </div>
        <AdminPanel />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>Mon Profil</span>
        </h2>
        <p className="text-sm text-white/50">Gérez vos informations et préférences</p>
      </div>

      {/* User Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-6 border border-white/10"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-white/20 flex items-center justify-center">
            <User className="w-10 h-10 text-white/50" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-white">{user.name || 'Utilisateur'}</h3>
            <p className="text-white/60">{user.phone}</p>
          </div>

          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              role === 'owner' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
              role === 'admin_neolife' ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' :
              role === 'ambassador' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
              'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {role === 'owner' ? 'Propriétaire' : role === 'admin_neolife' ? 'Admin Neolife' : role === 'ambassador' ? 'Ambassadeur' : 'Recommandeur'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getLevelColor(user.level)} bg-clip-text text-transparent border border-white/10`}>
              {getLevelName(user.level)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Upgrade to Ambassador Card */}
      {role === 'recommender' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative overflow-hidden glass-strong rounded-3xl p-6 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10"
        >
          {/* Animated background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
          
          <div className="flex flex-col items-center text-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Crown className="w-8 h-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Devenir Ambassadeur</h3>
              <p className="text-white/70 text-sm max-w-sm">
                Gagne plus d'argent en créant ta propre équipe ! C'est gratuit et immédiat.
              </p>
            </div>

            {upgradeSuccess ? (
              <div className="w-full py-3 px-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-center">
                🎉 Félicitations ! Tu es maintenant Ambassadeur.
              </div>
            ) : (
              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base shadow-lg shadow-purple-500/25 transition-all"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Activation en cours...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Activer mon compte Ambassadeur
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Administration Access for Admins */}
      {(role === 'owner' || role === 'admin_neolife') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAdmin(true)}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">Panneau d'Administration</h4>
              <p className="text-sm text-white/50">Gérez les produits, utilisateurs et configurations</p>
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="pt-6"
      >
        <Button
          variant="ghost"
          size="lg"
          onClick={logout}
          className="w-full h-14 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-2xl font-bold text-base transition-all"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Me déconnecter
        </Button>
      </motion.div>
    </div>
  )
}
