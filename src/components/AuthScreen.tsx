'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Phone, Lock, User, Zap, Loader2, Eye, EyeOff, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'

// ─── Aurora Blob ──────────────────────────────────────────────
function AuroraBlob({
  color,
  size,
  initialX,
  initialY,
  delay,
  slow,
}: {
  color: string
  size: number
  initialX: string
  initialY: string
  delay: number
  slow?: boolean
}) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${slow ? 'aurora-blob-slow' : 'aurora-blob'}`}
      style={{
        width: size,
        height: size,
        background: color,
        left: initialX,
        top: initialY,
        opacity: 0.35,
        animationDelay: `${delay}s`,
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.35 }}
      transition={{ duration: 2, delay: delay * 0.5, ease: 'easeOut' as any }}
    />
  )
}

// ─── Seeded pseudo-random for SSR consistency ─────────────────
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// ─── Floating Particle ────────────────────────────────────────
function FloatingParticle({ index }: { index: number }) {
  const config = useMemo(() => ({
    left: `${seededRandom(index * 7 + 1) * 100}%`,
    size: `${2 + seededRandom(index * 7 + 2) * 3}px`,
    duration: 12 + seededRandom(index * 7 + 3) * 20,
    delay: seededRandom(index * 7 + 4) * 10,
    drift: -20 + seededRandom(index * 7 + 5) * 40,
    opacity: 0.1 + seededRandom(index * 7 + 6) * 0.2,
    yDistance: -(600 + seededRandom(index * 7 + 7) * 400),
  }), [index])

  const bgColor = index % 3 === 0 ? '#f97316' : index % 3 === 1 ? '#ec4899' : '#a855f7'

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: config.left,
        bottom: '-5%',
        width: config.size,
        height: config.size,
        backgroundColor: bgColor,
      }}
      animate={{
        y: [0, config.yDistance * 0.6],
        x: [0, config.drift * 0.5],
        opacity: [0, config.opacity * 0.6, config.opacity * 0.6, 0],
        scale: [0.8, 1, 0.8],
      }}
      transition={{
        duration: config.duration * 1.5,
        delay: config.delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// ─── Particle System ──────────────────────────────────────────
function ParticleSystem() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {Array.from({ length: 8 }).map((_, i) => (
        <FloatingParticle key={i} index={i} />
      ))}
    </div>
  )
}

// ─── PIN Dots Visualization ───────────────────────────────────
function PinDots({ length, maxLen = 8 }: { length: number; maxLen?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: maxLen }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: i < 4 ? 8 : 6,
            height: i < 4 ? 8 : 6,
          }}
          animate={{
            backgroundColor: i < length ? '#f97316' : 'rgba(255,255,255,0.15)',
            scale: i < length ? 1 : 0.8,
            boxShadow: i < length ? '0 0 6px rgba(249,115,22,0.4)' : 'none',
          }}
          transition={{ duration: 0.2, ease: 'easeOut' as any }}
        />
      ))}
    </div>
  )
}

// ─── Success Particle Burst ───────────────────────────────────
function SuccessParticleBurst() {
  const particles = useMemo(() => {
    const colors = ['#f97316', '#ec4899', '#a855f7', '#fbbf24', '#34d399', '#f43f5e', '#06b6d4']
    return Array.from({ length: 50 }).map((_, i) => {
      const angle = (i / 50) * Math.PI * 2 + seededRandom(i * 5 + 100) * 0.5
      const distance = 150 + seededRandom(i * 5 + 101) * 350
      return {
        id: i,
        color: colors[i % colors.length],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        scale: 0.5 + seededRandom(i * 5 + 102) * 1.5,
        duration: 0.8 + seededRandom(i * 5 + 103) * 1.2,
        delay: seededRandom(i * 5 + 104) * 0.3,
        size: 3 + seededRandom(i * 5 + 105) * 6,
        isCircle: seededRandom(i * 5 + 106) > 0.5,
      }
    })
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: '50%',
            top: '45%',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
          }}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            scale: [0, p.scale, 0],
            x: p.x,
            y: p.y,
            opacity: [1, 1, 0],
            rotate: 720 + seededRandom(p.id * 3 + 200) * 360,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' as any }}
        />
      ))}

      {/* Expanding ring */}
      <motion.div
        className="absolute left-1/2 top-[45%] border-2 border-orange-400/40 rounded-full"
        style={{ width: 0, height: 0 }}
        initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.8 }}
        animate={{
          width: 600,
          height: 600,
          x: -300,
          y: -300,
          opacity: 0,
        }}
        transition={{ duration: 1.2, ease: 'easeOut' as any }}
      />
      <motion.div
        className="absolute left-1/2 top-[45%] border border-pink-400/30 rounded-full"
        style={{ width: 0, height: 0 }}
        initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.6 }}
        animate={{
          width: 500,
          height: 500,
          x: -250,
          y: -250,
          opacity: 0,
        }}
        transition={{ duration: 1, delay: 0.15, ease: 'easeOut' as any }}
      />
    </div>
  )
}

// ─── Typewriter Text ──────────────────────────────────────────
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    let i = 0
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1))
          i++
        } else {
          clearInterval(interval)
        }
      }, 80)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timeout)
  }, [text, delay])

  return (
    <span>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block w-[2px] h-[1em] bg-orange-400 ml-0.5 align-middle"
      />
    </span>
  )
}

// ─── Ripple Effect ────────────────────────────────────────────
function Ripple() {
  return (
    <motion.span
      className="absolute rounded-full bg-white/30 pointer-events-none"
      initial={{ width: 0, height: 0, opacity: 0.5, x: '-50%', y: '-50%' }}
      animate={{ width: 300, height: 300, opacity: 0, x: '-50%', y: '-50%' }}
      transition={{ duration: 0.6, ease: 'easeOut' as any }}
      style={{ left: '50%', top: '50%' }}
    />
  )
}

// ─── Animated Floating Label ──────────────────────────────────
function FloatingLabel({
  children,
  isFocused,
  hasValue,
  htmlFor,
}: {
  children: React.ReactNode
  isFocused: boolean
  hasValue: boolean
  htmlFor: string
}) {
  const isActive = isFocused || hasValue
  return (
    <motion.label
      htmlFor={htmlFor}
      className="absolute left-11 pointer-events-none origin-left"
      animate={{
        y: isActive ? -24 : 0,
        scale: isActive ? 0.75 : 1,
        color: isFocused ? '#f97316' : 'rgba(255,255,255,0.4)',
      }}
      transition={{ duration: 0.2, ease: 'easeOut' as any }}
      style={{ top: '50%', transformOrigin: 'left center' }}
    >
      {children}
    </motion.label>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function AuthScreen({ isModal = false }: { isModal?: boolean } = {}) {
  const setUser = useAppStore((s) => s.setUser)
  const setAuthLoading = useAppStore((s) => s.setAuthLoading)
  const isAuthLoading = useAppStore((s) => s.isAuthLoading)
  const addXPNotification = useAppStore((s) => s.addXPNotification)
  const setShowAuthModal = useAppStore((s) => s.setShowAuthModal)
  const setCurrentView = useAppStore((s) => s.setCurrentView)
  const preloadUserData = useAppStore((s) => s.preloadUserData)

  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [pinFocused, setPinFocused] = useState(false)
  const [confirmPinFocused, setConfirmPinFocused] = useState(false)
  const [nameFocused, setNameFocused] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [ripples, setRipples] = useState<number[]>([])

  // Shake animation variant
  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.5 },
  }

  // Form field stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as any } },
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      if (!phone || !pin) {
        setError('Veuillez remplir tous les champs')
        return
      }

      if (pin.length < 4) {
        setError('Le PIN doit contenir au moins 4 chiffres')
        return
      }

      setAuthLoading(true)

      try {
        const body: Record<string, string> = { phone, pin }

        if (isRegistering) {
          if (!confirmPin) {
            setError('Veuillez confirmer votre PIN')
            setAuthLoading(false)
            return
          }
          if (pin !== confirmPin) {
            setError('Les PINs ne correspondent pas')
            setAuthLoading(false)
            return
          }
          body.confirmPin = confirmPin
          if (name) body.name = name
        }

        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        const data = await res.json()

        if (!res.ok) {
          if (data.error?.includes('confirmPin') || res.status === 400) {
            if (!isRegistering) {
              setIsRegistering(true)
              setError('Nouveau numéro ? Inscrivez-vous ci-dessous')
            } else {
              setError(data.error || 'Erreur d\'inscription')
            }
          } else {
            setError(data.error || 'Erreur de connexion')
          }
          setAuthLoading(false)
          return
        }

        // Success - Start background data preloading immediately with fresh user data from API
        setShowSuccess(true)
        
        // IMPORTANT: Use data.user directly (fresh from DB) to avoid stale role from localStorage
        // This is critical for users whose role was promoted by an admin since last login
        const freshUser = data.user
        const freshToken = data.token
        
        // Trigger background data preloading with the FRESH user role from DB
        preloadUserData(freshUser, freshToken)
        
        // Wait ONLY for the animation time
        await new Promise((resolve) => setTimeout(resolve, 600))
        
        // setUser with fresh data from DB (overwrites any stale localStorage data)
        setUser(freshUser, freshToken)
        addXPNotification(50, 'Bienvenue !')
        setShowAuthModal(false)
        setCurrentView('dashboard')
      } catch {
        setError('Erreur réseau. Réessayez.')
        setAuthLoading(false)
      }
    },
    [phone, pin, confirmPin, name, isRegistering, setUser, addXPNotification, setAuthLoading, setShowAuthModal]
  )

  const handleRipple = () => {
    const id = Date.now()
    setRipples((prev) => [...prev, id])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r !== id))
    }, 700)
  }

  const authContent = (
    <>
      {/* ── Success Burst ── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50"
          >
            <SuccessParticleBurst />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: showSuccess ? 1.01 : 1,
        }}
        transition={{ duration: 0.6, ease: 'easeOut' as any }}
        className="relative z-10 w-full max-w-md mx-3 sm:mx-4 max-h-[96dvh]"
      >
        {/* Animated gradient border wrapper */}
        <div className={`relative rounded-2xl p-[1.5px] border-glow overflow-hidden ${showSuccess ? 'glow-orange' : ''}`}>
          {/* Gradient border background - static subtle gradient */}
          <div className="absolute inset-0 rounded-2xl">
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, #f97316, #ec4899, #a855f7, #06b6d4)',
                opacity: 0.6,
              }}
            />
          </div>

          {/* Card content */}
          <div className="relative backdrop-blur-2xl bg-[#0d0118]/85 rounded-2xl shadow-2xl p-3 sm:p-6 space-y-2 sm:space-y-4">
            {/* Logo & Branding */}
            <motion.div
              className="flex flex-col items-center gap-0.5 sm:gap-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="relative">
                <div className="relative z-10 flex items-center justify-center">
                  <img 
                    src="/icon.png" 
                    alt="Kidenzo Logo" 
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" 
                  />
                </div>
                {/* Subtle glow */}
                <div
                  className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 bg-orange-500/20 rounded-full blur-2xl"
                />
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-xl sm:text-3xl font-black gradient-text-warm"
              >
                Kidenzo
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-white/40 text-[9px] sm:text-xs uppercase tracking-widest"
              >
                Recommandez. Gagnez. Prospérez.
              </motion.p>
            </motion.div>

            {/* Success message overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl bg-[#0d0118]/90 backdrop-blur-sm"
                >
                  <div className="text-center space-y-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <img src="/icon.png" alt="Logo Kidenzo" className="w-16 h-16 mx-auto object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]" />
                    </motion.div>
                    <motion.p className="text-3xl font-black animated-gradient-text">
                      <TypewriterText text="Bienvenue !" delay={300} />
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                      className="text-white/50 text-sm"
                    >
                      +50 XP
                    </motion.p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
              <motion.div
                className="space-y-2.5 sm:space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Phone field */}
                <motion.div variants={itemVariants} className="relative">
                  <div className={`relative rounded-xl transition-all duration-300 ${phoneFocused ? 'shadow-[0_0_20px_rgba(249,115,22,0.15)]' : ''}`}>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg z-10">
                      🇨🇲
                    </span>
                    <FloatingLabel isFocused={phoneFocused} hasValue={phone.length > 0} htmlFor="phone">
                      Téléphone
                    </FloatingLabel>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={phoneFocused || phone ? '237XXXXXXXXX' : ''}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => setPhoneFocused(true)}
                      onBlur={() => setPhoneFocused(false)}
                      className="pl-11 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-orange-400/50 focus-visible:ring-orange-400/20 focus-visible:bg-white/[0.07] h-10 sm:h-12 text-sm sm:text-base rounded-xl transition-all duration-300"
                    />
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                  </div>
                </motion.div>

                {/* PIN field */}
                <motion.div variants={itemVariants} className="relative">
                  <div className={`relative rounded-xl transition-all duration-300 ${pinFocused ? 'shadow-[0_0_20px_rgba(249,115,22,0.15)]' : ''}`}>
                    <FloatingLabel isFocused={pinFocused} hasValue={pin.length > 0} htmlFor="pin">
                      PIN
                    </FloatingLabel>
                    <Input
                      id="pin"
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={8}
                      placeholder={pinFocused || pin ? '' : ''}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      onFocus={() => setPinFocused(true)}
                      onBlur={() => setPinFocused(false)}
                      className="pl-4 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-orange-400/50 focus-visible:ring-orange-400/20 focus-visible:bg-white/[0.07] h-10 sm:h-12 text-sm sm:text-base rounded-xl transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                      tabIndex={-1}
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {/* PIN dots visualization */}
                  <motion.div
                    className="flex justify-center mt-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: pin.length > 0 || pinFocused ? 1 : 0, height: pin.length > 0 || pinFocused ? 'auto' : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PinDots length={pin.length} maxLen={8} />
                  </motion.div>
                </motion.div>

                {/* Register fields */}
                <AnimatePresence>
                  {isRegistering && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' as any }}
                      className="overflow-hidden space-y-4"
                    >
                      {/* Confirm PIN */}
                      <div className="relative">
                        <div className={`relative rounded-xl transition-all duration-300 ${confirmPinFocused ? 'shadow-[0_0_20px_rgba(236,72,153,0.15)]' : ''}`}>
                          <FloatingLabel isFocused={confirmPinFocused} hasValue={confirmPin.length > 0} htmlFor="confirmPin">
                            Confirmer PIN
                          </FloatingLabel>
                          <Input
                            id="confirmPin"
                            type="password"
                            inputMode="numeric"
                            maxLength={8}
                            placeholder={confirmPinFocused || confirmPin ? '' : ''}
                            value={confirmPin}
                            onChange={(e) =>
                              setConfirmPin(e.target.value.replace(/\D/g, ''))
                            }
                            onFocus={() => setConfirmPinFocused(true)}
                            onBlur={() => setConfirmPinFocused(false)}
                            className="pl-4 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-pink-400/50 focus-visible:ring-pink-400/20 focus-visible:bg-white/[0.07] h-10 sm:h-12 text-sm sm:text-base rounded-xl transition-all duration-300"
                          />
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        </div>
                      </div>

                      {/* Name */}
                      <div className="relative">
                        <div className={`relative rounded-xl transition-all duration-300 ${nameFocused ? 'shadow-[0_0_20px_rgba(168,85,247,0.15)]' : ''}`}>
                          <FloatingLabel isFocused={nameFocused} hasValue={name.length > 0} htmlFor="name">
                            Nom (optionnel)
                          </FloatingLabel>
                          <Input
                            id="name"
                            type="text"
                            placeholder={nameFocused || name ? 'Votre nom' : ''}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onFocus={() => setNameFocused(true)}
                            onBlur={() => setNameFocused(false)}
                            className="pl-4 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-purple-400/50 focus-visible:ring-purple-400/20 focus-visible:bg-white/[0.07] h-10 sm:h-12 text-sm sm:text-base rounded-xl transition-all duration-300"
                          />
                          <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0, ...shakeAnimation }}
                      exit={{ opacity: 0, y: -5 }}
                      className="bg-red-500/15 border border-red-500/25 rounded-xl px-3 py-2 text-red-300 text-xs text-center backdrop-blur-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <motion.div variants={itemVariants} className="relative">
                  {/* Subtle glow behind button */}
                  <div className="absolute inset-0 rounded-xl">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-xl blur-lg opacity-20"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isAuthLoading || showSuccess}
                    onClick={handleRipple}
                    className="relative w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-400 hover:via-pink-400 hover:to-purple-400 text-white shadow-lg hover:shadow-orange-500/30 transition-all duration-300 rounded-xl overflow-hidden group"
                  >
                    {/* Ripples */}
                    {ripples.map((id) => (
                      <Ripple key={id} />
                    ))}

                    {/* Subtle shimmer overlay */}
                    <div className="absolute inset-0 shimmer rounded-xl opacity-30" />

                    <span className="relative flex items-center justify-center gap-2 z-10">
                      {showSuccess ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          className="flex items-center gap-2"
                        >
                          <Zap className="w-5 h-5" />
                          Bienvenue !
                        </motion.div>
                      ) : isAuthLoading ? (
                        <motion.div
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Loader2 className="w-5 h-5" />
                          </motion.div>
                          <motion.span
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            Chargement...
                          </motion.span>
                        </motion.div>
                      ) : isRegistering ? (
                        <>
                          <Sparkles className="w-5 h-5" />
                          S&apos;inscrire
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Se connecter
                        </>
                      )}
                    </span>
                  </Button>
                </motion.div>

              </motion.div>
            </form>

          </div>
        </div>

        {/* Bottom glow - static */}
        <div
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-orange-500/8 rounded-full blur-3xl pointer-events-none"
        />
        {/* Top glow - static */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"
        />
      </motion.div>
    </>
  )

  if (isModal) {
    return <>{authContent}</>
  }

  return (
    <div className="relative h-dvh flex items-center justify-center overflow-hidden bg-[#0d0118]">
      {/* ── Close Button ── */}
      <button
        onClick={() => {
          setShowAuthModal(false)
          setCurrentView('dashboard')
        }}
        className="absolute top-4 sm:top-6 right-4 sm:right-6 z-[100] w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur-md"
        aria-label="Fermer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* ── Aurora Background ── */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 20% 50%, #1a0533 0%, transparent 70%), radial-gradient(ellipse at 80% 50%, #4a1942 0%, transparent 70%), radial-gradient(ellipse at 50% 100%, #2d1040 0%, transparent 60%)',
          }}
        />
        {/* Aurora blobs */}
        <AuroraBlob color="#a855f7" size={500} initialX="5%" initialY="10%" delay={0} />
        <AuroraBlob color="#f97316" size={450} initialX="60%" initialY="5%" delay={1.5} slow />
        <AuroraBlob color="#ec4899" size={400} initialX="35%" initialY="55%" delay={3} />
        <AuroraBlob color="#7c3aed" size={350} initialX="70%" initialY="60%" delay={4.5} slow />
        {/* Subtle noise overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
      </div>

      {/* ── Floating Particles ── */}
      <ParticleSystem />

      {authContent}
    </div>
  )
}
