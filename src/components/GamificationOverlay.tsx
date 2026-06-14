'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Coins, Star } from 'lucide-react'
import { useAppStore, getLevelName, getLevelColor } from '@/lib/store'

// ── Seeded random for SSR consistency ──────────────────────────────────────
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// ── Confetti Constants ──────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  'oklch(0.72 0.22 30)',   // orange
  'oklch(0.65 0.2 320)',   // pink
  'oklch(0.55 0.24 290)',  // purple
  'oklch(0.7 0.18 160)',   // green
  'oklch(0.8 0.16 85)',    // gold
  'oklch(0.7 0.15 195)',   // cyan
  'oklch(0.6 0.25 25)',    // red
]

type ConfettiShape = 'circle' | 'square' | 'star'

// ── Confetti Piece ──────────────────────────────────────────────────────────
interface ConfettiPieceProps {
  index: number
}

function ConfettiPiece({ index }: ConfettiPieceProps) {
  const style = useMemo(() => {
    const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length]
    const left = seededRandom(index * 17 + 1) * 100
    const size = seededRandom(index * 17 + 2) * 10 + 5
    const duration = seededRandom(index * 17 + 3) * 2 + 2
    const delay = seededRandom(index * 17 + 4) * 1.0
    const rotationSpeed = seededRandom(index * 17 + 5) * 1080 + 360
    const heightFactor = seededRandom(index * 17 + 6) * 0.6 + 0.6

    // Determine shape
    const shapes: ConfettiShape[] = ['circle', 'square', 'star']
    const shape = shapes[index % 3]

    let borderRadius = '50%' // circle
    let clipPath = 'none'
    if (shape === 'square') {
      borderRadius = '2px'
    } else if (shape === 'star') {
      borderRadius = '0'
      clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
    }

    return {
      left: `${left}%`,
      width: `${size}px`,
      height: shape === 'star' ? `${size}px` : `${size * heightFactor}px`,
      backgroundColor: color,
      borderRadius,
      clipPath,
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
      '--rotation-speed': `${rotationSpeed}deg`,
    } as React.CSSProperties
  }, [index])

  return <div className="confetti-piece" style={style} />
}

// ── Confetti Effect ─────────────────────────────────────────────────────────
function ConfettiEffect() {
  const showConfetti = useAppStore((s) => s.showConfetti)

  if (!showConfetti) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {Array.from({ length: 50 }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </div>
  )
}

// ── Coin Float Animation ────────────────────────────────────────────────────
function CoinFloat({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <motion.div
      className="absolute -top-2 -right-2 pointer-events-none"
      initial={{ y: 0, opacity: 1, scale: 0.5 }}
      animate={{ y: -60, opacity: 0, scale: 1.2 }}
      transition={{ duration: 1.8, ease: 'easeOut' }}
    >
      <div className="coin-spin">
        <Coins className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
      </div>
    </motion.div>
  )
}

// ── XP Notification Item ────────────────────────────────────────────────────
interface XPNotificationItemProps {
  id: string
  amount: number
  reason: string
  timestamp: number
}

function XPNotificationItem({ id, amount, reason }: XPNotificationItemProps) {
  const removeXPNotification = useAppStore((s) => s.removeXPNotification)
  const [isFading, setIsFading] = useState(false)
  const hasCoins = reason.toLowerCase().includes('pièces')
  const [showCoin, setShowCoin] = useState(hasCoins)

  useEffect(() => {
    // Start fade at 2.0s, fully removed at 2.5s
    const fadeTimer = setTimeout(() => setIsFading(true), 2000)
    const removeTimer = setTimeout(() => removeXPNotification(id), 2500)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [id, removeXPNotification])

  return (
    <motion.div
      initial={{ x: 120, opacity: 0, scale: 0.85 }}
      animate={{ x: 0, opacity: isFading ? 0 : 1, scale: isFading ? 0.9 : 1 }}
      exit={{ x: 60, opacity: 0, scale: 0.7 }}
      transition={{ type: 'spring', stiffness: 350, damping: 22, mass: 0.8 }}
      className="relative flex items-center gap-2.5 px-4 py-3 rounded-xl min-w-[200px] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, oklch(0.55 0.24 290 / 90%), oklch(0.72 0.22 30 / 90%), oklch(0.65 0.2 320 / 90%))',
        boxShadow: '0 0 20px oklch(0.72 0.22 30 / 25%), 0 8px 32px oklch(0.55 0.24 290 / 20%), inset 0 1px 0 oklch(1 0 0 / 15%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Subtle glow behind */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, oklch(0.72 0.22 30 / 15%), transparent 70%)',
        }}
      />

      {/* XP icon */}
      <div className="relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-white/15">
        <Sparkles className="w-4.5 h-4.5 text-amber-300" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col gap-0.5">
        <span className="text-white font-bold text-sm leading-tight">
          +{amount} XP
        </span>
        <span className="text-white/70 text-xs leading-tight">{reason}</span>
      </div>

      {/* Coin icon if coins are awarded */}
      {hasCoins && (
        <div className="relative flex-shrink-0 ml-1">
          <div className="coin-spin">
            <Coins className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]" />
          </div>
        </div>
      )}

      {/* Dismiss button */}
      <button
        onClick={() => removeXPNotification(id)}
        className="relative ml-auto text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Floating coin animation */}
      {showCoin && (
        <CoinFloat onDone={() => setShowCoin(false)} />
      )}
    </motion.div>
  )
}

// ── XP Notifications Container ──────────────────────────────────────────────
function XPNotifications() {
  const xpNotifications = useAppStore((s) => s.xpNotifications)

  return (
    <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-3 max-w-[280px]">
      <AnimatePresence mode="popLayout">
        {xpNotifications.map((notification) => (
          <XPNotificationItem
            key={notification.id}
            id={notification.id}
            amount={notification.amount}
            reason={notification.reason}
            timestamp={notification.timestamp}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Level Up Particle (enhanced) ────────────────────────────────────────────
function LevelUpParticle({ index, total }: { index: number; total: number }) {
  const angle = (index / total) * 360
  const distance = 100 + seededRandom(index * 13 + 1) * 120
  const size = seededRandom(index * 13 + 2) * 6 + 3
  const delayExtra = seededRandom(index * 13 + 3) * 0.15

  // Vary particle colors
  const hue = (angle + 30) % 360

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        backgroundColor: `hsl(${hue}, 85%, 65%)`,
        left: '50%',
        top: '50%',
        width: `${size}px`,
        height: `${size}px`,
        boxShadow: `0 0 8px hsl(${hue}, 85%, 65% / 50%)`,
      }}
      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
      animate={{
        x: Math.cos((angle * Math.PI) / 180) * distance,
        y: Math.sin((angle * Math.PI) / 180) * distance,
        scale: [0, 2, 0],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 1.4,
        ease: 'easeOut',
        delay: 0.2 + delayExtra,
      }}
    />
  )
}

// ── Floating Sparkle ────────────────────────────────────────────────────────
function FloatingSparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute"
      style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0],
        rotate: [0, 180, 360],
        y: [0, -20, -40],
      }}
      transition={{
        duration: 2.5,
        delay,
        ease: 'easeOut',
      }}
    >
      <Star className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
    </motion.div>
  )
}

// ── Expanding Ring ──────────────────────────────────────────────────────────
function ExpandingRing({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute rounded-full border-2"
      style={{
        left: '50%',
        top: '50%',
        x: '-50%',
        y: '-50%',
        borderColor: color,
      }}
      initial={{ width: 0, height: 0, opacity: 0.8 }}
      animate={{
        width: [0, 300, 500],
        height: [0, 300, 500],
        opacity: [0.8, 0.4, 0],
      }}
      transition={{
        duration: 1.2,
        ease: 'easeOut',
      }}
    />
  )
}

// ── Screen Flash ────────────────────────────────────────────────────────────
function ScreenFlash() {
  return (
    <motion.div
      className="absolute inset-0 bg-white pointer-events-none"
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    />
  )
}

// ── Typewriter Text ─────────────────────────────────────────────────────────
function TypewriterText({ text, delay }: { text: string; delay: number }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay * 1000)
    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
      }
    }, 60)
    return () => clearInterval(interval)
  }, [started, text])

  return (
    <span>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  )
}

// ── Level Up Animation ──────────────────────────────────────────────────────
function LevelUpAnimation() {
  const levelUpAnimation = useAppStore((s) => s.levelUpAnimation)
  const hideLevelUp = useAppStore((s) => s.hideLevelUp)

  if (!levelUpAnimation?.show) return null

  const { level } = levelUpAnimation
  const levelColor = getLevelColor(level)
  const levelName = getLevelName(level)

  // Sparkle positions around the level number
  const sparklePositions = [
    { x: -80, y: -50, delay: 0.5 },
    { x: 90, y: -40, delay: 0.7 },
    { x: -70, y: 50, delay: 0.9 },
    { x: 80, y: 60, delay: 0.6 },
    { x: -30, y: -80, delay: 0.8 },
    { x: 40, y: 80, delay: 1.0 },
  ]

  // Get a representative color for the ring
  const ringColorMap: Record<number, string> = {
    1: 'rgba(148,163,184,0.6)',
    2: 'rgba(148,163,184,0.6)',
    3: 'rgba(52,211,153,0.6)',
    4: 'rgba(52,211,153,0.6)',
    5: 'rgba(251,146,60,0.6)',
    6: 'rgba(251,146,60,0.6)',
    7: 'rgba(192,132,252,0.6)',
    8: 'rgba(192,132,252,0.6)',
    9: 'rgba(251,191,36,0.6)',
    10: 'rgba(251,191,36,0.6)',
  }
  const ringColor = ringColorMap[Math.min(level, 10)] || 'rgba(251,191,36,0.6)'

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10000] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Screen flash */}
        <ScreenFlash />

        {/* Dark backdrop with blur */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={hideLevelUp}
        />

        {/* Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-3"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.2, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {/* Particles radiating from center */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 24 }).map((_, i) => (
              <LevelUpParticle key={i} index={i} total={24} />
            ))}
          </div>

          {/* Expanding rings */}
          <ExpandingRing color={ringColor} />
          <div style={{ position: 'absolute' }}>
            <motion.div
              className="rounded-full border"
              style={{ borderColor: ringColor }}
              initial={{ width: 0, height: 0, opacity: 0.6 }}
              animate={{
                width: [0, 250, 400],
                height: [0, 250, 400],
                opacity: [0.6, 0.3, 0],
              }}
              transition={{
                duration: 1.0,
                ease: 'easeOut',
                delay: 0.15,
              }}
            />
          </div>

          {/* Burst glow with pulse */}
          <motion.div
            className={`absolute w-56 h-56 rounded-full bg-gradient-to-br ${levelColor} opacity-20 blur-3xl`}
            initial={{ scale: 0 }}
            animate={{
              scale: [0, 2.5, 2.0, 2.2, 2.0],
              opacity: [0, 0.3, 0.2, 0.25, 0.15],
            }}
            transition={{ duration: 3.5, ease: 'easeOut' }}
          />

          {/* Secondary glow pulse */}
          <motion.div
            className="absolute w-32 h-32 rounded-full bg-amber-400 opacity-0 blur-2xl"
            animate={{
              scale: [1, 1.5, 1, 1.3, 1],
              opacity: [0, 0.2, 0.1, 0.15, 0.05],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />

          {/* NIVEAU SUPÉRIEUR text */}
          <motion.div
            initial={{ y: 30, opacity: 0, letterSpacing: '0.3em' }}
            animate={{ y: 0, opacity: 1, letterSpacing: '0.25em' }}
            transition={{ delay: 0.15, duration: 0.6, ease: 'easeOut' }}
            className="text-base md:text-lg font-bold text-white/70 uppercase tracking-[0.25em]"
          >
            Niveau supérieur !
          </motion.div>

          {/* Level number - dramatic entrance */}
          <div className="relative">
            {/* Glow pulse behind level number */}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${levelColor} blur-2xl rounded-full`}
              style={{ x: '-25%', y: '-25%', width: '150%', height: '150%' }}
              animate={{
                opacity: [0, 0.5, 0.3, 0.4, 0.2],
                scale: [0.8, 1.3, 1.1, 1.2, 1.0],
              }}
              transition={{
                duration: 3.0,
                ease: 'easeInOut',
                delay: 0.2,
              }}
            />

            {/* The level number itself */}
            <motion.div
              className={`relative text-8xl md:text-[10rem] font-black bg-gradient-to-br ${levelColor} bg-clip-text`}
              style={{ WebkitTextFillColor: 'transparent' }}
              initial={{ scale: 0.1, rotate: -180, opacity: 0 }}
              animate={{
                scale: [0.1, 1.6, 0.9, 1.05, 1],
                rotate: [-180, 10, -5, 0, 0],
                opacity: [0, 1, 1, 1, 1],
              }}
              transition={{
                duration: 1.0,
                ease: [0.34, 1.56, 0.64, 1], // elastic-like custom cubic-bezier
                times: [0, 0.35, 0.6, 0.8, 1],
              }}
            >
              {level}
            </motion.div>

            {/* Floating sparkles around level number */}
            {sparklePositions.map((pos, i) => (
              <FloatingSparkle key={i} delay={pos.delay} x={pos.x} y={pos.y} />
            ))}
          </div>

          {/* Level name with typewriter reveal */}
          <motion.div
            className={`text-2xl md:text-4xl font-bold bg-gradient-to-r ${levelColor} bg-clip-text`}
            style={{ WebkitTextFillColor: 'transparent' }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <TypewriterText text={levelName} delay={0.8} />
          </motion.div>

          {/* Decorative rotating stars */}
          <motion.div
            className="flex gap-4 mt-3"
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5, type: 'spring', stiffness: 300 }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  rotate: {
                    duration: 4,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: i * 0.3,
                  },
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.2,
                  },
                }}
              >
                <Sparkles className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main Export ─────────────────────────────────────────────────────────────
export default function GamificationOverlay() {
  return (
    <>
      <ConfettiEffect />
      <XPNotifications />
      <LevelUpAnimation />
    </>
  )
}
