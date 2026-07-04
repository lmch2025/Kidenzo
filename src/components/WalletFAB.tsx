'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, X } from 'lucide-react'
import { useAppStore } from '@/lib/store'

const MESSAGES = [
  "💰 Paie petit à petit",
  "🐷 Mets de côté pour acheter",
  "📦 Ton produit, à ton rythme"
]

export default function WalletFAB() {
  const { user, openWalletModal, setShowAuthModal } = useAppStore()
  const [messageIndex, setMessageIndex] = useState(0)
  const [showTooltip, setShowTooltip] = useState(true)

  useEffect(() => {
    // Rotate messages every 5 seconds
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length)
    }, 5000)

    return () => clearInterval(msgInterval)
  }, [])

  const handleClick = () => {
    if (!user) {
      setShowAuthModal(true, "Connecte-toi pour accéder à ton porte-monnaie")
      return
    }
    openWalletModal()
  }

  return (
    <div className="fixed z-50 bottom-[80px] right-4 md:bottom-6 md:right-6 flex items-center justify-end pointer-events-none">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="mr-3 glass-strong rounded-full py-2 px-4 flex items-center gap-2 pointer-events-auto"
          >
            <span className="text-sm font-medium whitespace-nowrap text-white/90">
              <AnimatePresence mode="wait">
                <motion.span
                  key={messageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="inline-block"
                >
                  {MESSAGES[messageIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false)
                // Bring back tooltip after 30s
                setTimeout(() => setShowTooltip(true), 30000)
              }}
              className="text-white/50 hover:text-white/80 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className="pointer-events-auto relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF512F] to-[#DD2476] shadow-lg shadow-pink-500/30 flex items-center justify-center flex-shrink-0 border-2 border-white/20"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Wallet className="w-8 h-8 text-white drop-shadow-md" />
        </motion.div>
      </motion.button>
    </div>
  )
}
