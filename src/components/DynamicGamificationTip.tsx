'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, Target, Sparkles, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export function DynamicGamificationTip() {
  const gamificationData = useAppStore((s) => s.gamificationData)
  const setDashboardTab = useAppStore((s) => s.setDashboardTab)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  const progress = gamificationData?.progress
  const pointsToNextLevel = (progress?.xpNeededForNextLevel || 0)

  // Générer des astuces dynamiques basées sur l'état de l'utilisateur
  const tips: Array<{ icon: React.ElementType; title: string; message: string; color: string; iconColor: string }> = []

  // Astuce de base (toujours présente, termes très simples)
  tips.push({
    icon: Lightbulb,
    title: "💡 Comment gagner des cadeaux ?",
    message: "Envoie tes liens à tes amis. S'ils cliquent, tu gagnes des points pour débloquer des récompenses !",
    color: "from-amber-400 to-orange-500",
    iconColor: "text-amber-500"
  })

  // Astuce progression
  if (pointsToNextLevel > 0 && pointsToNextLevel <= 50) {
    tips.push({
      icon: Sparkles,
      title: "✨ Bientôt le niveau supérieur !",
      message: `Plus que ${pointsToNextLevel} points pour avoir ton prochain cadeau. Partage un produit tout de suite !`,
      color: "from-blue-400 to-indigo-500",
      iconColor: "text-blue-500"
    })
  }

  // Removed quests tip since it's not supported by GamificationData

  // Rotation des astuces toutes les 8 secondes si on en a plusieurs
  useEffect(() => {
    if (tips.length <= 1) return
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [tips.length])

  const activeTip = tips[currentTipIndex % tips.length]
  const Icon = activeTip?.icon

  if (!activeTip || !gamificationData) return null

  return (
    <div className="mb-6 relative h-auto min-h-[5rem] sm:min-h-[6rem]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTipIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0 w-full"
        >
          <div 
            className="h-full overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-3 sm:p-4 shadow-lg group cursor-pointer hover:bg-white/[0.08] transition-colors"
            onClick={() => setDashboardTab('gamification')}
          >
            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${activeTip.color}`} />
            <div className="flex items-center gap-3 sm:gap-4 h-full">
              <div className={`p-2 sm:p-2.5 rounded-xl bg-white/10 ${activeTip.iconColor} shrink-0 shadow-inner`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="text-sm sm:text-base font-bold text-white mb-0.5 sm:mb-1 truncate">{activeTip.title}</h4>
                <p className="text-[11px] sm:text-sm text-white/70 leading-snug sm:leading-relaxed line-clamp-2">
                  {activeTip.message}
                </p>
              </div>
              <div className="shrink-0 self-center hidden sm:block">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-110 transition-all">
                  <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
