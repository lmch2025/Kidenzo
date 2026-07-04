'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PiggyBank, ChevronLeft, Loader2, CheckCircle2, Info
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

interface SavingsGoalSheetProps {
  open: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    basePrice: number
    images?: { storageUrl: string }[]
  } | null
}

export default function SavingsGoalSheet({ 
  open, onClose, product 
}: SavingsGoalSheetProps) {
  const { user, openWalletModal } = useAppStore()
  
  const [step, setStep] = useState(product ? 1 : 0)
  const [durationDays, setDurationDays] = useState(30)
  const [initialDeposit, setInitialDeposit] = useState('0')
  const [customProductName, setCustomProductName] = useState('')
  const [customProductPrice, setCustomProductPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const targetAmount = product ? product.basePrice : parseInt(customProductPrice) || 0
  const effectiveProductName = product ? product.name : customProductName
  const dailyTarget = targetAmount / durationDays

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Vous devez être connecté')
      return
    }

    setLoading(true)
    try {
      // Create goal
      const targetDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      const payload: any = {
        userId: user.id,
        targetDate
      }
      if (product) {
        payload.productId = product.id
      } else {
        payload.customProductName = customProductName
        payload.customProductPrice = customProductPrice
      }

      const res = await fetch('/api/wallet/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const goalData = await res.json()
        const depositAmount = parseInt(initialDeposit)

        // Make initial deposit if > 0
        if (!isNaN(depositAmount) && depositAmount > 0) {
          await fetch('/api/wallet/savings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              goalId: goalData.id,
              amount: depositAmount
            })
          })
        }

        setStep(4) // Success
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erreur lors de la création de l\'épargne')
      }
    } catch (error) {
      toast.error('Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] bg-[#0A0A0A] border-t border-white/10 p-0 sm:max-w-md sm:mx-auto sm:h-[85vh] sm:rounded-t-[2rem] flex flex-col">
        <div className="p-4 sm:p-6 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
          <div className="flex items-center gap-2 mb-2">
            {step > 0 && step < 4 && (
              <button onClick={() => setStep(step - 1)} className="p-1 rounded-full hover:bg-white/10">
                <ChevronLeft className="w-5 h-5 text-white/70" />
              </button>
            )}
            <SheetTitle className="text-xl font-bold text-white flex-1 text-center m-0 p-0">
              {step === 0 && "Ton objectif"}
              {step === 1 && "Mettre de côté"}
              {step === 2 && "Ton rythme"}
              {step === 3 && "Démarrer"}
              {step === 4 && "Objectif Créé !"}
            </SheetTitle>
            {step > 0 && step < 4 && <div className="w-7" />}
          </div>
          
          {step > 0 && step < 4 && (
            <div className="flex gap-1 mb-4">
              {[1,2,3].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-gradient-to-r from-orange-400 to-yellow-400' : 'bg-white/10'}`} />
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
              {/* STEP 0: Custom Product Entry */}
              {step === 0 && !product && (
                <div className="space-y-6">
                  <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
                    <h3 className="font-semibold text-lg text-white mb-2 text-center">Quel est ton objectif ?</h3>
                    <div className="space-y-2">
                      <Label className="text-white/70">Nom du produit / projet</Label>
                      <Input 
                        placeholder="Ex: PS5, Voyage, Moto..."
                        value={customProductName}
                        onChange={e => setCustomProductName(e.target.value)}
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Objectif à atteindre (FCFA)</Label>
                      <Input 
                        type="number"
                        placeholder="Ex: 350000"
                        value={customProductPrice}
                        onChange={e => setCustomProductPrice(e.target.value)}
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => setStep(1)} 
                    disabled={!customProductName || !customProductPrice || parseInt(customProductPrice) < 5000}
                    className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl shadow-lg shadow-orange-500/25"
                  >
                    Continuer
                  </Button>
                </div>
              )}

              {/* STEP 1: Product Summary */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="glass rounded-2xl p-4 border border-white/10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/10" />
                    <div className="relative">
                      {product?.images?.[0] ? (
                        <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden mb-4 border border-white/20">
                          <Image src={product.images[0].storageUrl} alt={effectiveProductName} width={128} height={128} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-32 h-32 mx-auto rounded-xl bg-white/5 flex items-center justify-center mb-4">
                          <PiggyBank className="w-12 h-12 text-white/20" />
                        </div>
                      )}
                      <h3 className="font-semibold text-lg text-white mb-2">{effectiveProductName}</h3>
                      <p className="text-3xl font-bold gradient-text-warm">{formatPrice(targetAmount)}</p>
                    </div>
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex gap-3">
                    <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-100 mb-1">C'est la meilleure méthode !</h4>
                      <p className="text-sm text-orange-200/70">Mets un peu d'argent de côté quand tu veux. Ton argent est en sécurité et quand tu atteins la somme, le produit est à toi.</p>
                    </div>
                  </div>

                  <Button onClick={() => setStep(2)} className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-yellow-500 text-black hover:from-orange-400 hover:to-yellow-400 rounded-xl shadow-lg shadow-orange-500/25 font-semibold">
                    Créer mon objectif
                  </Button>
                </div>
              )}

              {/* STEP 2: Set Timeline */}
              {step === 2 && (
                <div className="space-y-8 mt-4">
                  <div className="text-center">
                    <p className="text-white/70 mb-2">En combien de temps veux-tu l'acheter ?</p>
                    <p className="text-3xl font-bold text-white mb-2">{durationDays} jours</p>
                    <p className="text-orange-400 text-sm">
                      Soit environ <span className="font-bold">{Math.ceil(durationDays / 30)} mois</span>
                    </p>
                  </div>
                  
                  <div className="px-2">
                    <Slider 
                      value={[durationDays]} 
                      onValueChange={(v) => setDurationDays(v[0])}
                      min={7} max={180} step={1}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>1 sem</span>
                      <span>6 mois</span>
                    </div>
                  </div>

                  <Card className="glass border-orange-500/30">
                    <CardContent className="p-6 text-center">
                      <p className="text-white/70 text-sm mb-2">Idéalement, tu devras verser :</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-bold text-white">{formatPrice(dailyTarget)}</span>
                        <span className="text-white/50 text-sm mt-2">/ jour</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Button onClick={() => setStep(3)} className="w-full h-14 text-lg bg-white text-black hover:bg-white/90 rounded-xl font-semibold">
                    Ça me va !
                  </Button>
                </div>
              )}

              {/* STEP 3: Confirmation + First Deposit */}
              {step === 3 && (
                <div className="space-y-6 mt-4">
                  <div className="glass rounded-xl p-4 border border-white/10 flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden shrink-0">
                      {product?.images?.[0] ? (
                        <Image src={product.images[0].storageUrl} alt={effectiveProductName} width={64} height={64} className="object-cover w-full h-full" />
                      ) : null}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white leading-tight">{effectiveProductName}</h4>
                      <p className="text-sm text-orange-400 mt-1">Objectif: {formatPrice(targetAmount)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white/80 text-base">Combien tu veux mettre aujourd'hui ?</Label>
                    <div className="relative">
                      <Input 
                        type="number"
                        value={initialDeposit} 
                        onChange={(e) => setInitialDeposit(e.target.value)}
                        className="bg-black/20 border-white/10 focus:border-orange-500 h-14 text-lg pl-10"
                        placeholder="Ex: 1000"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">FCFA</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[500, 1000, Math.round(dailyTarget)].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setInitialDeposit(amt.toString())}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-medium text-white/80"
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-white/40 text-center">Tu peux aussi mettre 0 et commencer plus tard.</p>
                  </div>

                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-yellow-500 text-black hover:from-orange-400 hover:to-yellow-400 rounded-xl shadow-lg shadow-orange-500/25 mt-4 font-bold"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Commencer l'épargne !"}
                  </Button>
                </div>
              )}

              {/* STEP 4: Success */}
              {step === 4 && (
                <div className="text-center py-8 space-y-6">
                  <div className="relative">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-24 h-24 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center border-2 border-orange-500/30"
                    >
                      <PiggyBank className="w-12 h-12 text-orange-400" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: -20 }}
                      transition={{ delay: 0.3 }}
                      className="absolute top-0 right-[25%] bg-white text-black px-2 py-1 rounded-lg text-xs font-bold"
                    >
                      +{initialDeposit} FCFA !
                    </motion.div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Bravo ! 🐷</h3>
                    <p className="text-white/70">Ton objectif d'épargne est créé.</p>
                  </div>

                  <Card className="bg-black/30 border-white/5">
                    <CardContent className="p-4 text-sm text-white/70">
                      Chaque petit pas compte. N'oublie pas de venir verser un peu d'argent régulièrement.
                    </CardContent>
                  </Card>

                  <Button 
                    onClick={() => {
                      onClose()
                      openWalletModal({ tab: 'savings' })
                    }} 
                    className="w-full h-14 text-lg bg-white text-black rounded-xl font-bold"
                  >
                    Voir mon épargne
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
