'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, Clock, ArrowRight, ArrowDownCircle, 
  ShoppingCart, PiggyBank, CreditCard, Loader2,
  Calendar, CheckCircle2, ChevronRight, X
} from 'lucide-react'
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAppStore, formatPrice } from '@/lib/store'
import { toast } from 'sonner'
import Image from 'next/image'

interface CustomerWalletModalProps {
  isStandalone?: boolean
  onCustomCredit?: () => void
  onCustomSavings?: () => void
}

export default function CustomerWalletModal({ isStandalone, onCustomCredit, onCustomSavings }: CustomerWalletModalProps = {}) {
  const { 
    user, token, showWalletModal, closeWalletModal, 
    customerWallet, setCustomerWallet, walletModalContext
  } = useAppStore()
  
  const [activeTab, setActiveTab] = useState<'home' | 'credits' | 'savings' | 'history'>('home')
  const [loading, setLoading] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [isDepositing, setIsDepositing] = useState(false)

  useEffect(() => {
    if (showWalletModal && user && token) {
      fetchWallet()
      if (walletModalContext?.tab) {
        setActiveTab(walletModalContext.tab)
      } else {
        setActiveTab('home')
      }
    }
  }, [showWalletModal, user, token, walletModalContext])

  const fetchWallet = async () => {
    if (!user || !token) return
    setLoading(true)
    try {
      const res = await fetch(`/api/wallet?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCustomerWallet(data)
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du chargement du porte-monnaie')
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !token || !depositAmount) return

    const amount = parseInt(depositAmount)
    if (isNaN(amount) || amount < 500) {
      toast.error('Le montant minimum est de 500 FCFA')
      return
    }

    setIsDepositing(true)
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'deposit',
          userId: user.id,
          amount
        })
      })

      if (res.ok) {
        const data = await res.json()
        setCustomerWallet(data)
        setDepositAmount('')
        toast.success(`Dépôt de ${formatPrice(amount)} réussi ! 🎉`)
        // Trigger confetti could be here
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erreur lors du dépôt')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setIsDepositing(false)
    }
  }

  const renderTabNavigation = () => (
    <div className="flex overflow-x-auto pb-2 mb-4 gap-2 scrollbar-none snap-x">
      {[
        { id: 'home', label: 'Accueil', icon: Wallet },
        { id: 'credits', label: 'Mes Crédits', icon: ShoppingCart },
        { id: 'savings', label: 'Mon Épargne', icon: PiggyBank },
        { id: 'history', label: 'Historique', icon: Clock }
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap snap-start transition-all ${
            activeTab === tab.id 
              ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md' 
              : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/5'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          <span className="font-medium text-sm">{tab.label}</span>
        </button>
      ))}
    </div>
  )

  const renderHome = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Balance Card */}
      <div className="glass rounded-3xl p-6 relative overflow-hidden border-orange-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-transparent" />
        <div className="relative">
          <p className="text-white/70 text-sm mb-1 font-medium">Solde disponible</p>
          <h2 className="text-4xl font-bold text-white mb-6">
            {formatPrice(customerWallet?.balance || 0)}
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
              <div className="flex items-center gap-2 text-pink-400 mb-1">
                <ShoppingCart className="w-4 h-4" />
                <span className="text-xs font-medium">Crédits en cours</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {customerWallet?.activePlans?.filter((p: any) => p.status === 'active').length || 0}
              </p>
            </div>
            <div className="bg-black/20 rounded-2xl p-3 border border-white/5">
              <div className="flex items-center gap-2 text-orange-400 mb-1">
                <PiggyBank className="w-4 h-4" />
                <span className="text-xs font-medium">Épargnes actives</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {customerWallet?.savingsGoals?.filter((g: any) => g.status === 'active').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/70 px-2 uppercase tracking-wider">Actions Rapides</h3>
        
        <form onSubmit={handleDeposit} className="glass rounded-2xl p-4 border border-white/10 space-y-3">
          <label className="text-sm font-medium text-white flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
            Verser de l'argent
          </label>
          <div className="flex gap-2">
            <Input 
              type="number" 
              placeholder="Montant (ex: 1000)" 
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="bg-black/20 border-white/10 focus:border-orange-500/50"
            />
            <Button 
              type="submit" 
              disabled={isDepositing || !depositAmount}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isDepositing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Valider'}
            </Button>
          </div>
          <div className="flex gap-2">
            {[500, 1000, 2000, 5000].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setDepositAmount(amt.toString())}
                className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-medium text-white/80 transition-colors"
              >
                {amt}
              </button>
            ))}
          </div>
        </form>

        <button 
          onClick={() => {
            if (!isStandalone) closeWalletModal()
            if (onCustomCredit) onCustomCredit()
          }}
          className="w-full glass rounded-2xl p-4 border border-white/10 flex items-center justify-between group hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center border border-pink-500/30">
              <ShoppingCart className="w-5 h-5 text-pink-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white group-hover:text-pink-400 transition-colors">Acheter à crédit</p>
              <p className="text-xs text-white/50">Choisis un produit et paie à ton rythme</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-pink-400 transition-colors" />
        </button>

        <button 
          onClick={() => {
            if (!isStandalone) closeWalletModal()
            if (onCustomSavings) onCustomSavings()
          }}
          className="w-full glass rounded-2xl p-4 border border-white/10 flex items-center justify-between group hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center border border-orange-500/30">
              <PiggyBank className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white group-hover:text-orange-400 transition-colors">Épargner pour un produit</p>
              <p className="text-xs text-white/50">Mets de côté chaque jour</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-orange-400 transition-colors" />
        </button>
      </div>
    </div>
  )

  const renderCredits = () => {
    const plans = customerWallet?.activePlans || []
    
    if (plans.length === 0) {
      return (
        <div className="text-center py-12 animate-in fade-in px-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
            <ShoppingCart className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Aucun achat en cours</h3>
          <p className="text-sm text-white/50 mb-6">Explore la boutique pour acheter des produits à crédit !</p>
          <Button onClick={() => closeWalletModal()} className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full px-8">
            Voir la boutique
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 pb-20">
        {plans.map((plan: any) => {
          const progress = ((plan.totalAmount - plan.remainingAmount) / plan.totalAmount) * 100
          
          return (
            <Card key={plan.id} className="glass border-white/10 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 border-b border-white/5">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {plan.productImage ? (
                        <Image src={plan.productImage} alt={plan.productName} width={64} height={64} className="object-cover" />
                      ) : (
                        <ShoppingCart className="w-8 h-8 text-white/20" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white line-clamp-1">{plan.productName}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-white/70">Reste à payer</span>
                        <span className="font-bold text-orange-400">{formatPrice(plan.remainingAmount)}</span>
                      </div>
                      <Progress value={progress} className="h-1.5 mt-2 bg-white/10" />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-black/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/50 mb-0.5">Prochain versement</p>
                    <p className="font-medium text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-pink-400" />
                      {plan.nextDueDate ? new Date(plan.nextDueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Terminé'}
                      <span className="text-white/30 mx-1">•</span>
                      {formatPrice(plan.installmentAmount)}
                    </p>
                  </div>
                  
                  {plan.status === 'active' && (
                    <Button size="sm" className="bg-white text-black hover:bg-white/90 rounded-full font-semibold">
                      Payer
                    </Button>
                  )}
                  {plan.status === 'completed' && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Payé
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  const renderSavings = () => {
    const goals = customerWallet?.savingsGoals || []
    
    if (goals.length === 0) {
      return (
        <div className="text-center py-12 animate-in fade-in px-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
            <PiggyBank className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Aucune épargne en cours</h3>
          <p className="text-sm text-white/50 mb-6">Mets de l'argent de côté chaque jour pour t'offrir ce que tu veux !</p>
          <Button onClick={() => closeWalletModal()} className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full px-8">
            Choisir un produit
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 pb-20">
        {goals.map((goal: any) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100
          
          return (
            <Card key={goal.id} className="glass border-white/10 overflow-hidden relative">
              {goal.status === 'completed' && (
                <div className="absolute inset-0 bg-emerald-500/10 z-0" />
              )}
              <CardContent className="p-5 relative z-10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 flex items-center justify-center overflow-hidden shrink-0">
                    {goal.productImage ? (
                      <Image src={goal.productImage} alt={goal.productName} width={56} height={56} className="object-cover" />
                    ) : (
                      <PiggyBank className="w-6 h-6 text-orange-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white leading-tight mb-1">{goal.productName}</h4>
                    <p className="text-xs text-white/50">
                      Objectif : {formatPrice(goal.targetAmount)}
                    </p>
                  </div>
                  {goal.status === 'completed' && (
                    <Badge className="bg-emerald-500 text-white border-0 shrink-0">Prêt !</Badge>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-white">{formatPrice(goal.currentAmount)}</span>
                    <span className="text-white/50">Économisé</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-white/5" />
                </div>

                {goal.status === 'active' && (
                  <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                    <div className="flex-1">
                      <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Objectif du jour</p>
                      <p className="font-semibold text-orange-400">{formatPrice(goal.dailyTarget || 0)}</p>
                    </div>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/20">
                      Verser
                    </Button>
                  </div>
                )}
                
                {goal.status === 'completed' && (
                  <Button className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full">
                    Acheter maintenant
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  const renderHistory = () => {
    const txs = customerWallet?.recentTransactions || []
    
    if (txs.length === 0) {
      return (
        <div className="text-center py-12 text-white/50 text-sm">
          Aucune transaction pour le moment
        </div>
      )
    }

    const getIcon = (type: string) => {
      switch(type) {
        case 'deposit': return <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
        case 'installment_payment': return <CreditCard className="w-5 h-5 text-pink-400" />
        case 'savings_deposit': return <PiggyBank className="w-5 h-5 text-orange-400" />
        default: return <Wallet className="w-5 h-5 text-blue-400" />
      }
    }

    return (
      <div className="space-y-3 pb-20 animate-in fade-in">
        {txs.map((tx: any) => (
          <div key={tx.id} className="glass rounded-xl p-3 border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center shrink-0">
              {getIcon(tx.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-white truncate">{tx.description}</p>
              <p className="text-xs text-white/50">
                {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className={`font-semibold text-sm shrink-0 ${tx.amount > 0 && tx.type === 'deposit' ? 'text-emerald-400' : 'text-white'}`}>
              {tx.amount > 0 && tx.type === 'deposit' ? '+' : ''}{formatPrice(tx.amount)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Sheet open={isStandalone ? true : showWalletModal} onOpenChange={(open) => {
      if (!open && !isStandalone) closeWalletModal()
    }}>
      <SheetContent side="bottom" className="h-[90vh] bg-[#0A0A0A] border-t border-white/10 p-0 sm:max-w-md sm:mx-auto sm:h-[85vh] sm:rounded-t-[2rem]">
        {loading && !customerWallet ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 sm:p-6 pb-2 shrink-0">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
              <SheetHeader className="mb-4 text-left">
                <SheetTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-orange-500" />
                  Mon Porte-monnaie
                </SheetTitle>
              </SheetHeader>
              
              {renderTabNavigation()}
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 scrollbar-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {activeTab === 'home' && renderHome()}
                  {activeTab === 'credits' && renderCredits()}
                  {activeTab === 'savings' && renderSavings()}
                  {activeTab === 'history' && renderHistory()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
