'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronRight, Package, User, MapPin, MessageSquare,
  CheckCircle2, AlertCircle, Phone, ArrowLeft, Loader2, ShoppingBag,
} from 'lucide-react'
import { useAppStore, formatPrice, type RecommenderProduct, type Product } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// Unified product item shape for the picker
interface ProductPickerItem {
  miniSiteId: string
  productName: string
  productPrice: number
  productImage: string | undefined
  commissionPct: number
}

export default function CreateOrderModal() {
  const {
    showCreateOrderModal,
    setShowCreateOrderModal,
    recommenderProducts,
    user,
    addOrder,
  } = useAppStore()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedItem, setSelectedItem] = useState<ProductPickerItem | null>(null)

  // Fetch all active products from catalogue for everyone
  const [catalogItems, setCatalogItems] = useState<ProductPickerItem[]>([])
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerMessage, setCustomerMessage] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isAmbassador = user?.role === 'ambassador'

  // Build a map of recommender products to know their custom commission
  const recommenderCommissionMap = new Map<string, number>()
  recommenderProducts.forEach((rp) => {
    recommenderCommissionMap.set(rp.miniSiteId, rp.commissionPct)
  })

  // Fetch all active products for the catalog
  const fetchCatalog = useCallback(async () => {
    setIsLoadingCatalog(true)
    try {
      const res = await fetch('/api/products?status=active')
      if (res.ok) {
        const data = await res.json()
        const products = data.products || data || []
        const items: ProductPickerItem[] = products
          .filter((p: any) => p.miniSite) // only products with a mini-site can be ordered
          .map((p: any) => {
            const miniSiteId = p.miniSite.id
            // If recommender has a custom commission, use it, otherwise use maxCommission
            const commission = recommenderCommissionMap.has(miniSiteId)
              ? recommenderCommissionMap.get(miniSiteId)!
              : p.recommenderMaxCommission || p.maxCommission || 0

            return {
              miniSiteId,
              productName: p.name || 'Produit',
              productPrice: p.basePrice || 0,
              productImage: p.images?.[0]?.storageUrl,
              commissionPct: commission,
            }
          })
        setCatalogItems(items)
      }
    } catch (err) {
      console.error('Failed to fetch catalog', err)
    } finally {
      setIsLoadingCatalog(false)
    }
  }, [recommenderCommissionMap])

  useEffect(() => {
    if (showCreateOrderModal) {
      fetchCatalog()
    }
  }, [showCreateOrderModal, fetchCatalog])

  // Reset when closing
  useEffect(() => {
    if (!showCreateOrderModal) {
      const t = setTimeout(() => {
        setStep(1)
        setSelectedItem(null)
        setCustomerName('')
        setCustomerPhone('')
        setCustomerAddress('')
        setCustomerMessage('')
        setError(null)
        setSuccess(false)
        setCatalogItems([])
      }, 300)
      return () => clearTimeout(t)
    }
  }, [showCreateOrderModal])

  const displayItems = catalogItems

  const handleNext = () => {
    setError(null)
    if (step === 1) {
      if (!selectedItem) {
        setError('Veuillez choisir un produit à vendre.')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
        setError('Veuillez remplir le nom, le numéro et le lieu de livraison.')
        return
      }
      setStep(3)
    }
  }

  const handleSubmit = async () => {
    if (!selectedItem || !user) return
    setIsSubmitting(true)
    setError(null)
    try {
      const payload = {
        miniSiteId: selectedItem.miniSiteId,
        recommenderId: user.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        customerMessage: customerMessage.trim() || null,
        finalPrice: selectedItem.productPrice,
      }
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création de la commande')
      setSuccess(true)
      if (data.order) addOrder(data.order)
      setTimeout(() => setShowCreateOrderModal(false), 3200)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Une erreur est survenue. Réessaye.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!showCreateOrderModal) return null

  return (
    <AnimatePresence>
      {showCreateOrderModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ background: 'oklch(0.08 0.02 280 / 0.98)', backdropFilter: 'blur(16px)' }}
        >
          {/* Aurora background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl"
              style={{ background: 'radial-gradient(circle, oklch(0.6 0.18 160), transparent 70%)' }}
            />
            <div
              className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-15 blur-3xl"
              style={{ background: 'radial-gradient(circle, oklch(0.55 0.16 140), transparent 70%)' }}
            />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-4 py-4 border-b border-white/10">
            <div className="w-10 h-10">
              {step > 1 && !success && (
                <button
                  onClick={() => { setError(null); setStep(step - 1 as 1 | 2 | 3) }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="text-center">
              <h2 className="text-lg font-bold text-white">Nouvelle Commande</h2>
              {!success && (
                <p className="text-xs text-emerald-400 mt-0.5">
                  {step === 1 ? 'Choix du produit' : step === 2 ? 'Infos du client' : 'Vérification'}
                </p>
              )}
            </div>

            <button
              onClick={() => setShowCreateOrderModal(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Fermer"
            >
              {!success && <X className="w-5 h-5" />}
            </button>
          </div>

          {/* Progress pills */}
          {!success && (
            <div className="relative z-10 flex justify-center gap-2 pt-4 px-4">
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  animate={{ width: s === step ? 40 : 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`h-2 rounded-full ${
                    s === step
                      ? 'bg-emerald-400'
                      : s < step
                      ? 'bg-emerald-600'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Scrollable body */}
          <div className="relative z-10 flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto px-4 py-6 pb-36">
              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SUCCESS */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                  className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-6 py-12"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: 1, duration: 0.5, delay: 0.2 }}
                    className="w-28 h-28 rounded-full flex items-center justify-center"
                    style={{ background: 'oklch(0.5 0.18 160 / 0.2)', border: '3px solid oklch(0.6 0.18 160 / 0.6)' }}
                  >
                    <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-emerald-400 mb-3">Bravo !</h3>
                    <p className="text-xl text-white/80">La commande a bien été enregistrée.</p>
                    <p className="text-sm text-muted-foreground mt-2">Elle apparaîtra dans "Mes Commandes".</p>
                  </div>
                </motion.div>
              )}

              {/* STEP 1: Product picker */}
              {!success && step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  <h3 className="text-2xl font-bold text-white mb-2 text-center">
                    Que veut acheter votre client ?
                  </h3>
                  <p className="text-center text-muted-foreground text-sm mb-6">
                    Appuie sur le produit que le client souhaite
                  </p>

                  {isLoadingCatalog ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16">
                      <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                      <p className="text-muted-foreground">Chargement des produits…</p>
                    </div>
                  ) : displayItems.length === 0 ? (
                    <div className="text-center p-8 rounded-3xl border border-white/10 bg-white/5">
                      <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                      <p className="text-lg text-muted-foreground font-medium">
                        Aucun produit disponible dans le catalogue.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayItems.map((item) => {
                        const isSelected = selectedItem?.miniSiteId === item.miniSiteId
                        return (
                          <motion.button
                            key={item.miniSiteId}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedItem(item)}
                            className={`w-full flex items-center gap-4 p-4 rounded-3xl border-2 text-left transition-all duration-200 ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                            }`}
                          >
                            {/* Product image */}
                            <div className="w-20 h-20 rounded-2xl bg-black/40 overflow-hidden shrink-0 flex items-center justify-center border border-white/10">
                              {item.productImage ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-8 h-8 text-muted-foreground/50" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-base leading-tight text-white mb-1 line-clamp-2">
                                {item.productName}
                              </p>
                              <p className="text-emerald-400 font-bold text-sm">
                                {formatPrice(item.productPrice)}
                              </p>
                              {item.commissionPct > 0 && (
                                <span className="inline-block mt-1 text-xs text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                                  Commission {item.commissionPct}%
                                </span>
                              )}
                            </div>

                            {/* Radio dot */}
                            <div
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-500'
                                  : 'border-white/20 bg-transparent'
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: Customer info */}
              {!success && step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-1">Infos du client</h3>
                    <p className="text-muted-foreground text-sm">Remplis les infos pour la livraison</p>
                  </div>

                  {[
                    {
                      icon: User,
                      label: 'Comment s\'appelle le client ?',
                      value: customerName,
                      setValue: setCustomerName,
                      placeholder: 'Ex : Marie Mbarga',
                      type: 'text',
                      required: true,
                    },
                    {
                      icon: Phone,
                      label: 'Quel est son numéro de téléphone ?',
                      value: customerPhone,
                      setValue: setCustomerPhone,
                      placeholder: 'Ex : 690 00 00 00',
                      type: 'tel',
                      required: true,
                    },
                    {
                      icon: MapPin,
                      label: 'Où doit-on livrer ?',
                      value: customerAddress,
                      setValue: setCustomerAddress,
                      placeholder: 'Quartier, point de repère…',
                      type: 'text',
                      required: true,
                    },
                  ].map(({ icon: Icon, label, value, setValue, placeholder, type, required }) => (
                    <div key={label}>
                      <label className="flex items-center gap-2 text-base font-semibold mb-2.5">
                        <Icon className="w-5 h-5 text-emerald-400 shrink-0" />
                        {label}
                        {required && <span className="text-red-400 text-xs ml-auto">Obligatoire</span>}
                      </label>
                      <Input
                        type={type}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="h-16 rounded-2xl text-base px-5 bg-white/5 border-white/10 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 placeholder:text-muted-foreground/50"
                      />
                    </div>
                  ))}
                </motion.div>
              )}

              {/* STEP 3: Message + Summary */}
              {!success && step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-1">Vérification</h3>
                    <p className="text-muted-foreground text-sm">Confirme les informations avant d'envoyer</p>
                  </div>

                  {/* Optional message */}
                  <div>
                    <label className="flex items-center gap-2 text-base font-semibold mb-2.5">
                      <MessageSquare className="w-5 h-5 text-emerald-400" />
                      Message pour le livreur
                      <span className="text-muted-foreground text-xs ml-auto">Optionnel</span>
                    </label>
                    <Textarea
                      value={customerMessage}
                      onChange={(e) => setCustomerMessage(e.target.value)}
                      placeholder="Ex: Appeler avant d'arriver, bâtiment bleu…"
                      className="min-h-[100px] rounded-2xl text-base p-5 bg-white/5 border-white/10 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 resize-none placeholder:text-muted-foreground/50"
                    />
                  </div>

                  {/* Summary card */}
                  <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/10 bg-white/5">
                      <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Résumé</p>
                    </div>
                    <div className="p-5 space-y-4">
                      {[
                        { label: '🛍 Produit', value: selectedItem?.productName || '—' },
                        { label: '👤 Client', value: customerName || '—' },
                        { label: '📞 Téléphone', value: customerPhone || '—' },
                        { label: '📍 Livraison', value: customerAddress || '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between gap-4">
                          <span className="text-muted-foreground text-sm">{label}</span>
                          <span className="font-semibold text-sm text-right max-w-[55%] break-words">{value}</span>
                        </div>
                      ))}

                      <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                        <span className="text-base text-muted-foreground">💰 Prix total</span>
                        <span className="text-2xl font-extrabold text-emerald-400">
                          {formatPrice(selectedItem?.productPrice || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom CTA bar */}
          {!success && (
            <div className="absolute bottom-0 left-0 right-0 z-20 px-4 py-4 pb-8 border-t border-white/10" style={{ background: 'oklch(0.08 0.02 280 / 0.95)', backdropFilter: 'blur(12px)' }}>
              <div className="max-w-lg mx-auto">
                {step < 3 ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    disabled={step === 1 && !selectedItem}
                    className="w-full h-16 rounded-full text-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{ background: 'linear-gradient(135deg, oklch(0.6 0.18 160), oklch(0.55 0.16 185))' }}
                  >
                    Continuer
                    <ChevronRight className="w-6 h-6" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-16 rounded-full text-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-xl shadow-emerald-500/30"
                    style={{ background: 'linear-gradient(135deg, oklch(0.58 0.2 160), oklch(0.52 0.18 185))' }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-6 h-6" />
                        Confirmer la commande
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
