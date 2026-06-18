'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, ArrowUpRight, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Phone } from 'lucide-react'
import { useAppStore, formatPrice } from '@/lib/store'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

interface WithdrawalRequest {
  id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  createdAt: string
  phoneNumber: string
}

interface WalletData {
  balance: number
  minWithdrawal: number
  history: WithdrawalRequest[]
}

export function WalletTab() {
  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState('')

  const { user, token } = useAppStore()

  const fetchWalletData = async () => {
    if (!user) return
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/withdrawals?userId=${user.id}`, { headers })
      const json = await res.json()
      if (res.ok) {
        setData(json)
      } else {
        toast.error(json.error || 'Erreur de chargement du portefeuille')
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [])

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!data) return

    const numAmount = parseInt(amount)
    if (isNaN(numAmount) || numAmount < data.minWithdrawal) {
      toast.error(`Le montant minimum est de ${formatPrice(data.minWithdrawal)}`)
      return
    }

    if (numAmount > data.balance) {
      toast.error('Solde insuffisant')
      return
    }

    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error('Veuillez entrer un numéro de téléphone valide')
      return
    }

    setRequesting(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: user?.id, amount: numAmount, phoneNumber })
      })

      const result = await res.json()

      if (res.ok) {
        toast.success('Demande de retrait envoyée avec succès')
        setAmount('')
        setPhoneNumber('')
        fetchWalletData()
      } else {
        toast.error(result.error || 'Erreur lors de la demande')
      }
    } catch (error) {
      toast.error('Erreur serveur')
    } finally {
      setRequesting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>
      case 'approved': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Approuvé</Badge>
      case 'paid': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Payé</Badge>
      case 'rejected': return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1" /> Refusé</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!data) return null

  const hasPendingRequest = data.history.some(h => h.status === 'pending' || h.status === 'approved')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-purple-500/10" />
        
        <div className="relative flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
              <Wallet className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-medium">Mon Portefeuille</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Solde disponible</p>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text tracking-tight">
              {formatPrice(data.balance)}
            </h1>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Formulaire de retrait */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-white/5">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-orange-400" />
                Demander un retrait
              </h3>

              {hasPendingRequest ? (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">
                    Vous avez déjà une demande en cours de traitement. Veuillez patienter avant d'en faire une nouvelle.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleWithdrawal} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Montant à retirer (FCFA)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={data.minWithdrawal}
                        max={data.balance}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`Min. ${data.minWithdrawal}`}
                        className="pl-9 bg-white/5 border-white/10 focus:border-orange-500/50"
                        required
                      />
                      <Wallet className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Montant minimum : <span className="font-semibold text-foreground">{formatPrice(data.minWithdrawal)}</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Numéro Mobile Money</Label>
                    <div className="relative">
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Ex: 0990000000"
                        className="pl-9 bg-white/5 border-white/10 focus:border-orange-500/50"
                        required
                      />
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
                    disabled={requesting || data.balance < data.minWithdrawal}
                  >
                    {requesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {requesting ? 'Traitement...' : 'Confirmer le retrait'}
                  </Button>
                  
                  {data.balance < data.minWithdrawal && (
                    <p className="text-xs text-center text-red-400 mt-2">
                      Votre solde est insuffisant pour effectuer un retrait.
                    </p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Historique */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-white/5 h-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-pink-400" />
                Historique des retraits
              </h3>

              {data.history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucun retrait pour le moment
                </div>
              ) : (
                <div className="space-y-3">
                  {data.history.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div>
                        <p className="font-semibold text-sm">{formatPrice(req.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{req.phoneNumber}</p>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
