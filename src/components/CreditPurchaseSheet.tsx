'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, ChevronLeft, Loader2, CheckCircle2, Info, 
  Smartphone, Download, Share, ArrowRight, Package, Truck, Bell
} from 'lucide-react'
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { useAppStore, formatPrice } from '@/lib/store'
import { toast } from 'sonner'
import Image from 'next/image'

interface CreditPurchaseSheetProps {
  open: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    basePrice: number
    images?: { storageUrl: string }[]
  } | null
  miniSiteId: string
  recommenderId?: string
  commissionPct?: number
}

// ─── PWA Install Hook ──────────────────────────────────────────────────
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream)

    // Detect if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => setIsInstalled(true)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return result.outcome === 'accepted'
  }, [deferredPrompt])

  return { deferredPrompt, isInstalled, isIOS, promptInstall }
}

export default function CreditPurchaseSheet({ 
  open, onClose, product, miniSiteId, recommenderId 
}: CreditPurchaseSheetProps) {
  const { user, openWalletModal } = useAppStore()
  const { deferredPrompt, isInstalled, isIOS, promptInstall } = usePWAInstall()
  
  // ─── Form State ───────────────────────────────────────────────
  const [step, setStep] = useState(product ? 1 : 0)
  const [downPaymentPct, setDownPaymentPct] = useState(30)
  const [duration, setDuration] = useState(30) // days
  
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerMessage, setCustomerMessage] = useState('')
  
  const [customProductName, setCustomProductName] = useState('')
  const [customProductPrice, setCustomProductPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [pwaInstalling, setPwaInstalling] = useState(false)

  // ─── Admin Config (fetched dynamically) ───────────────────────
  const [minDownPct, setMinDownPct] = useState(20)
  const [maxDownPct, setMaxDownPct] = useState(80)
  const [minDays, setMinDays] = useState(7)
  const [maxDays, setMaxDays] = useState(180)

  // Fetch wallet config on open
  useEffect(() => {
    if (open) {
      fetch('/api/admin?action=wallet-overview')
        .then(r => r.json())
        .then(data => {
          if (data.config) {
            const c = data.config
            const min = parseInt(c.wallet_min_down_payment_pct || '20')
            const max = parseInt(c.wallet_max_down_payment_pct || '80')
            setMinDownPct(min)
            setMaxDownPct(max)
            setMinDays(parseInt(c.wallet_min_installment_days || '7'))
            setMaxDays(parseInt(c.wallet_max_installment_days || '180'))
            // Set initial down payment to admin minimum
            setDownPaymentPct(Math.max(downPaymentPct, min))
          }
        })
        .catch(() => {})
    }
  }, [open])

  // Pre-fill if user is logged in
  useEffect(() => {
    if (user && step >= 1) {
      if (!customerName) setCustomerName(user.name || '')
      if (!customerPhone) setCustomerPhone(user.phone || '')
    }
  }, [user, step])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(product ? 1 : 0)
      setLoading(false)
    }
  }, [open, product])

  // ─── Computed Values ──────────────────────────────────────────
  const totalAmount = product ? product.basePrice : parseInt(customProductPrice) || 0
  const downPayment = (totalAmount * downPaymentPct) / 100
  const remainingAmount = totalAmount - downPayment
  const effectiveProductName = product ? product.name : customProductName
  const dailyPayment = duration > 0 ? remainingAmount / duration : remainingAmount

  // ─── Submit Handler ───────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user) {
      toast.error('Tu dois te connecter d\'abord')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/wallet/installment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          miniSiteId,
          customerName,
          customerPhone,
          customerAddress,
          customerMessage,
          finalPrice: totalAmount,
          customProductName: !product ? customProductName : undefined,
          downPaymentPct,
          frequency: 'daily',
          durationDays: duration,
          recommenderId
        })
      })

      if (res.ok) {
        setStep(5) // Success + PWA Install
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erreur lors de la création du plan')
      }
    } catch (error) {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  // ─── PWA Install Handler ──────────────────────────────────────
  const handleInstallPWA = async () => {
    setPwaInstalling(true)
    try {
      const accepted = await promptInstall()
      if (accepted) {
        toast.success('🎉 Application installée avec succès !')
        if (user) {
          const { subscribeToPushNotifications } = await import('@/lib/push-client')
          await subscribeToPushNotifications(user.id)
        }
      }
    } catch {
      // Fallback: nothing
    } finally {
      setPwaInstalling(false)
    }
  }

  // Subscribe to push immediately on step 5 if already installed
  useEffect(() => {
    if (step === 5 && isInstalled && user) {
      import('@/lib/push-client').then(({ subscribeToPushNotifications }) => {
        subscribeToPushNotifications(user.id)
      })
    }
  }, [step, isInstalled, user])

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent side="bottom" className="h-[92vh] bg-[#0A0A0A] border-t border-white/10 p-0 sm:max-w-md sm:mx-auto sm:h-[85vh] sm:rounded-t-[2rem] flex flex-col">
        <div className="p-4 sm:p-6 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
          <div className="flex items-center gap-2 mb-2">
            {step > 0 && step < 5 && (
              <button onClick={() => setStep(step - 1)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-5 h-5 text-white/70" />
              </button>
            )}
            <SheetTitle className="text-xl font-bold text-white flex-1 text-center m-0 p-0">
              {step === 0 && "Ton produit"}
              {step === 1 && "Acheter à crédit"}
              {step === 2 && "Ton acompte de livraison"}
              {step === 3 && "Tes coordonnées"}
              {step === 4 && "Vérifie ta commande"}
              {step === 5 && "🎉 Commande validée !"}
            </SheetTitle>
            {step > 0 && step < 5 && <div className="w-7" />}
          </div>
          
          {step > 0 && step < 5 && (
            <div className="flex gap-1 mb-4">
              {[1,2,3,4].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-white/10'}`} />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8 scrollbar-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {/* ═══════════════════════════════════════════════════════
                  STEP 0: Custom Product (no catalog product)
                  ═══════════════════════════════════════════════════════ */}
              {step === 0 && !product && (
                <div className="space-y-6">
                  <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
                    <h3 className="font-semibold text-lg text-white mb-2 text-center">Quel produit veux-tu acheter ?</h3>
                    <div className="space-y-2">
                      <Label className="text-white/70">Nom du produit</Label>
                      <Input 
                        placeholder="Ex: iPhone 13 Pro"
                        value={customProductName}
                        onChange={e => setCustomProductName(e.target.value)}
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/30 h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Prix total estimé (FCFA)</Label>
                      <Input 
                        type="number"
                        placeholder="Ex: 350000"
                        value={customProductPrice}
                        onChange={e => setCustomProductPrice(e.target.value)}
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/30 h-12"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => setStep(1)} 
                    disabled={!customProductName || !customProductPrice || parseInt(customProductPrice) < 5000}
                    className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl shadow-lg shadow-pink-500/25"
                  >
                    Continuer
                  </Button>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════
                  STEP 1: Product Summary + How it Works
                  ═══════════════════════════════════════════════════════ */}
              {step === 1 && (
                <div className="space-y-5">
                  {/* Product Card */}
                  <div className="glass rounded-2xl p-4 border border-white/10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-pink-500/10" />
                    <div className="relative">
                      {product?.images?.[0] ? (
                        <div className="w-28 h-28 mx-auto rounded-xl overflow-hidden mb-3 border border-white/20">
                          <Image src={product.images[0].storageUrl} alt={effectiveProductName} width={112} height={112} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-28 h-28 mx-auto rounded-xl bg-white/5 flex items-center justify-center mb-3">
                          <ShoppingCart className="w-10 h-10 text-white/20" />
                        </div>
                      )}
                      <h3 className="font-semibold text-lg text-white mb-1">{effectiveProductName}</h3>
                      <p className="text-3xl font-bold gradient-text">{formatPrice(totalAmount)}</p>
                    </div>
                  </div>

                  {/* How it works - 3 steps visual */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white/60 uppercase tracking-wider text-center">Comment ça marche ?</p>
                    
                    <div className="space-y-2">
                      {[
                        { icon: Package, color: 'text-orange-400 bg-orange-500/15', title: `Paie ${minDownPct}% minimum maintenant`, desc: `Dès ${formatPrice(totalAmount * minDownPct / 100)} pour débloquer la livraison` },
                        { icon: Truck, color: 'text-emerald-400 bg-emerald-500/15', title: 'Reçois ton produit chez toi', desc: 'Livraison dès que l\'acompte est confirmé' },
                        { icon: Bell, color: 'text-blue-400 bg-blue-500/15', title: 'Rembourse un peu chaque jour', desc: 'L\'appli te rappelle et suit tes paiements' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                          <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white text-sm">{item.title}</p>
                            <p className="text-xs text-white/50">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={() => setStep(2)} className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl shadow-lg shadow-pink-500/25">
                    <span className="flex items-center gap-2">Choisir mon acompte <ArrowRight className="w-5 h-5" /></span>
                  </Button>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════
                  STEP 2: Down Payment + Duration
                  ═══════════════════════════════════════════════════════ */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* Down Payment */}
                  <Card className="glass border-white/10">
                    <CardContent className="p-5 text-center">
                      <p className="text-white/60 mb-1 text-sm">💰 Ton acompte pour la livraison</p>
                      <p className="text-4xl font-bold text-white mb-1">{formatPrice(downPayment)}</p>
                      <p className="text-xs text-emerald-400 font-medium mb-5">✓ Ton produit est livré dès le paiement de cet acompte</p>
                      
                      <div className="space-y-3">
                        <Slider 
                          value={[downPaymentPct]} 
                          onValueChange={(v) => setDownPaymentPct(v[0])}
                          min={minDownPct} max={maxDownPct} step={5}
                          className="py-4"
                        />
                        <div className="flex justify-between text-xs text-white/40 font-medium">
                          <span>Min {minDownPct}%</span>
                          <span className="text-orange-400 font-bold text-sm">{downPaymentPct}%</span>
                          <span>Max {maxDownPct}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Duration */}
                  <Card className="glass border-white/10">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-white/70 text-sm">Rembourser le reste en</span>
                        <span className="text-white font-bold text-lg">{duration} jours</span>
                      </div>
                      <Slider 
                        value={[duration]} 
                        onValueChange={(v) => setDuration(v[0])}
                        min={minDays} max={maxDays} step={1}
                      />
                      <div className="flex justify-between text-xs text-white/40 mt-2">
                        <span>{minDays}j</span>
                        <span>{maxDays}j</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Summary Card */}
                  <Card className="bg-gradient-to-br from-orange-500/15 to-pink-500/15 border-orange-500/30">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white/80 text-sm">Reste à rembourser</span>
                        <span className="text-white font-bold">{formatPrice(remainingAmount)}</span>
                      </div>
                      <div className="h-px bg-white/10 mb-3" />
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Paiement par jour</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-orange-400">{formatPrice(dailyPayment)}</span>
                          <span className="text-white/50 text-xs block">pendant {duration} jours</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button onClick={() => setStep(3)} className="w-full h-14 text-lg bg-white text-black hover:bg-white/90 rounded-xl">
                    Continuer
                  </Button>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════
                  STEP 3: Customer Info
                  ═══════════════════════════════════════════════════════ */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-white/50 mb-2">Pour la livraison de ton produit</p>
                  <div className="space-y-2">
                    <Label className="text-white/70">Ton Nom</Label>
                    <Input 
                      value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                      className="bg-black/20 border-white/10 focus:border-pink-500 h-12"
                      placeholder="Ex: Jean Kamga"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Ton Numéro (WhatsApp / Mobile Money)</Label>
                    <Input 
                      value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                      className="bg-black/20 border-white/10 focus:border-pink-500 h-12"
                      placeholder="Ex: 699 000 000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Adresse de livraison</Label>
                    <Input 
                      value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)}
                      className="bg-black/20 border-white/10 focus:border-pink-500 h-12"
                      placeholder="Ex: Douala, Akwa, Rue de la Joie"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Message (Optionnel)</Label>
                    <Input 
                      value={customerMessage} onChange={(e) => setCustomerMessage(e.target.value)}
                      className="bg-black/20 border-white/10 focus:border-pink-500 h-12"
                      placeholder="Couleur préférée, taille..."
                    />
                  </div>

                  <Button 
                    onClick={() => setStep(4)} 
                    disabled={!customerName || !customerPhone || !customerAddress}
                    className="w-full h-14 mt-4 text-lg bg-white text-black hover:bg-white/90 rounded-xl"
                  >
                    Vérifier ma commande
                  </Button>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════
                  STEP 4: Confirmation
                  ═══════════════════════════════════════════════════════ */}
              {step === 4 && (
                <div className="space-y-5">
                  <Card className="glass border-white/10">
                    <CardContent className="p-0">
                      <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                        <h4 className="font-semibold text-white">{effectiveProductName}</h4>
                        <p className="text-sm text-white/50">{customerName} • {customerPhone}</p>
                        <p className="text-xs text-white/40 mt-0.5">{customerAddress}</p>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Prix Total</span>
                          <span className="text-white font-medium">{formatPrice(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Acompte à payer ({downPaymentPct}%)</span>
                          <span className="text-emerald-400 font-bold">{formatPrice(downPayment)}</span>
                        </div>
                        <div className="h-px bg-white/10 my-2" />
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Reste à rembourser</span>
                          <span className="text-white font-medium">{formatPrice(remainingAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Plan de remboursement</span>
                          <span className="text-orange-400 font-bold">{formatPrice(dailyPayment)}/jour × {duration}j</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-3">
                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-200/80">
                      Ton produit sera livré dès que l'acompte de <strong className="text-blue-300">{formatPrice(downPayment)}</strong> sera confirmé. 
                      Tu rembourseras ensuite <strong className="text-blue-300">{formatPrice(dailyPayment)}</strong> par jour via l'application.
                    </p>
                  </div>

                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/25"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "✓ Confirmer ma commande"}
                  </Button>
                  <p className="text-xs text-center text-white/40">En confirmant, tu t'engages à rembourser le reste chaque jour.</p>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════
                  STEP 5: Success + PWA Install Prompt
                  ═══════════════════════════════════════════════════════ */}
              {step === 5 && (
                <div className="text-center py-4 space-y-5">
                  {/* Success animation */}
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">C'est fait !</h3>
                    <p className="text-white/60 text-sm">Ta commande a été enregistrée</p>
                  </div>

                  {/* Reminder summary */}
                  <Card className="bg-black/30 border-white/5 text-left">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Acompte à payer</span>
                        <span className="text-emerald-400 font-bold">{formatPrice(downPayment)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Remboursement quotidien</span>
                        <span className="text-orange-400 font-bold">{formatPrice(dailyPayment)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Pendant</span>
                        <span className="text-white font-medium">{duration} jours</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ─── PWA Install Section ─────────────────────── */}
                  {!isInstalled && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-5 space-y-4"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Smartphone className="w-6 h-6 text-blue-400" />
                        <h4 className="font-bold text-white text-lg">Installe l'Application</h4>
                      </div>
                      
                      <p className="text-sm text-white/70">
                        <strong className="text-white">Obligatoire pour les rappels de paiement.</strong> L'appli te rappelle chaque jour ton versement et s'arrête automatiquement dès que tu as payé.
                      </p>

                      {/* Android / Chrome: native prompt */}
                      {deferredPrompt && (
                        <Button 
                          onClick={handleInstallPWA}
                          disabled={pwaInstalling}
                          className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-lg shadow-lg shadow-blue-500/25"
                        >
                          {pwaInstalling ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          ) : (
                            <Download className="w-5 h-5 mr-2" />
                          )}
                          Installer maintenant
                        </Button>
                      )}

                      {/* iOS: manual instructions */}
                      {isIOS && !deferredPrompt && (
                        <div className="bg-black/30 rounded-xl p-4 space-y-3 text-left">
                          <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">Sur iPhone / iPad :</p>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                              <Share className="w-4 h-4 text-blue-400" />
                            </div>
                            <p className="text-sm text-white/80">Appuie sur <strong className="text-white">Partager</strong> (le carré avec la flèche)</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                              <Download className="w-4 h-4 text-blue-400" />
                            </div>
                            <p className="text-sm text-white/80">Puis <strong className="text-white">« Sur l'écran d'accueil »</strong></p>
                          </div>
                        </div>
                      )}

                      {/* Fallback: not iOS, not deferred prompt */}
                      {!isIOS && !deferredPrompt && (
                        <div className="bg-black/30 rounded-xl p-4 text-left">
                          <p className="text-sm text-white/70">
                            Utilise le menu de ton navigateur <strong className="text-white">(⋮)</strong> puis choisis <strong className="text-white">« Installer l'application »</strong> ou <strong className="text-white">« Ajouter à l'écran d'accueil »</strong>.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Already installed */}
                  {isInstalled && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <p className="text-sm text-emerald-200">Application déjà installée ! Tu recevras tes rappels quotidiens automatiquement.</p>
                    </div>
                  )}

                  {/* CTA */}
                  <Button 
                    onClick={() => {
                      onClose()
                      openWalletModal({ tab: 'credits' })
                    }} 
                    className="w-full h-14 text-lg bg-white text-black rounded-xl"
                  >
                    Voir mon porte-monnaie
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  )
}
