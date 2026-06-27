'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Share2, Copy, Check, MessageSquare, Users, Download, Loader2, Wand2, RefreshCw, Image as ImageIcon, Sparkles } from 'lucide-react'
import { formatPrice } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

// Seeded random for SSR
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// ─── Marketing Share Modal ────────────────────────────────────────
export default function MarketingShareModal({
  open,
  onClose,
  product,
  commissionPct,
  shareLink,
}: {
  open: boolean
  onClose: () => void
  product: { name: string; basePrice: number; imageUrl?: string; description?: string; category?: string } | null
  commissionPct: number
  shareLink: string
}) {
  const [copied, setCopied] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [nativeShareSupported] = useState(() => {
    if (typeof navigator === 'undefined') return false
    return !!navigator.share
  })

  const [aiText, setAiText] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiModel, setAiModel] = useState<string | null>(null)

  // Generate AI marketing text when modal opens
  const generateAiText = useCallback(async () => {
    setAiLoading(true)
    setAiText(null)
    try {
      const res = await fetch('/api/generate-marketing-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product?.name,
          basePrice: product?.basePrice,
          commissionPct,
          description: product?.description,
          category: product?.category,
          shareLink,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.text) {
          setAiText(data.text)
          setAiModel(data.model || null)
        }
      }
    } catch (err) {
      console.error('Failed to generate AI text:', err)
    } finally {
      setAiLoading(false)
    }
  }, [product, commissionPct, shareLink])

  // Auto-generate when modal opens
  useEffect(() => {
    if (open && product?.name) {
      generateAiText()
    }
    if (!open) {
      setAiText(null)
      setAiModel(null)
    }
  }, [open, product?.name, generateAiText])

  const finalPrice = product ? product.basePrice * (1 + commissionPct / 100) : 0

  const marketingMessages = useMemo(() => {
    if (!product) return []
    const imageNote = product.imageUrl ? " 📸 Voir l'image dans le lien" : ''
    return [
      {
        label: '🔥 Offre flash',
        message: `🔥 OFFRE EXCLUSIVE ! ${product.name} à seulement ${formatPrice(finalPrice)} ! Commandez maintenant, stock limité !${imageNote} 👉 ${shareLink}`,
      },
      {
        label: '💯 Recommandation',
        message: `💯 J'ai trouvé ce produit incroyable : ${product.name} à ${formatPrice(finalPrice)}. Qualité garantie !${imageNote} 👉 ${shareLink}`,
      },
      {
        label: '⏰ Urgence',
        message: `⏰ Dernière chance ! ${product.name} à ${formatPrice(finalPrice)}. Ne ratez pas cette offre !${imageNote} 👉 ${shareLink}`,
      },
      {
        label: '🎁 Cadeau',
        message: `🎁 Offrez-vous ${product.name} ! Seulement ${formatPrice(finalPrice)}. Livraison rapide !${imageNote} 👉 ${shareLink}`,
      },
    ]
  }, [product, finalPrice, shareLink])

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const shareToWhatsApp = (message: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank')
  }

  const shareToTwitter = () => {
    if (!product) return
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Découvrez ${product.name} à ${formatPrice(finalPrice)} !`)}&url=${encodeURIComponent(shareLink)}`, '_blank')
  }

  // Native share with image file attached
  const shareWithImage = async () => {
    if (!product?.imageUrl) return
    setImageLoading(true)

    let blob: Blob | null = null
    let fileName = 'image.png'

    try {
      // Fetch image through proxy to avoid CORS issues
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(product.imageUrl)}`
      const res = await fetch(proxyUrl)
      if (!res.ok) throw new Error('Failed to fetch image')

      blob = await res.blob()
      // Determine file extension from content type
      const contentType = res.headers.get('Content-Type') || 'image/png'
      const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : contentType.includes('webp') ? 'webp' : 'png'
      fileName = `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`
      const imageFile = new File([blob], fileName, { type: contentType })

      const shareData = {
        title: product.name,
        text: `Découvrez ${product.name} à ${formatPrice(finalPrice)} ! Commandez maintenant 👉`,
        url: shareLink,
        files: [imageFile],
      }

      // Check if sharing files is supported
      if (navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData)
          return // Success
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return // User cancelled
          throw err // Go to fallback
        }
      } else {
        throw new Error('File sharing not supported') // trigger manual fallback
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return // User cancelled
      
      // Fallback: copy text and download image
      try {
        if (blob) {
          await copyToClipboard(`Découvrez ${product.name} à ${formatPrice(finalPrice)} ! 📸 Voir l'image jointe\n👉 ${shareLink}`, 'fallback-share')
          
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          alert("L'image a été téléchargée et le texte a été copié ! Vous n'avez plus qu'à coller le texte là où vous partagez l'image.")
        } else {
          alert("Impossible de charger l'image pour le moment.")
        }
      } catch (fallbackErr) {
        console.error('Fallback sharing failed:', fallbackErr)
      }
    } finally {
      setImageLoading(false)
    }
  }

  if (!product) return null

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="bg-[#0d0118]/98 backdrop-blur-2xl border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-white text-xl flex items-center gap-2">
            <Share2 className="w-5 h-5 text-orange-400" />
            Outils Marketing
          </SheetTitle>
          <SheetDescription className="text-white/50">
            Partagez <strong className="text-white/70">{product.name}</strong> et gagnez {formatPrice(product.basePrice * commissionPct / 100)} par vente + 5 FCFA/clic
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pt-4">
          {/* ── AI-Generated Marketing Text (HERO SECTION) ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden border border-orange-500/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-pink-500/5 to-purple-500/5" />
            <div className="relative p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                    <Wand2 className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-orange-400/80 uppercase tracking-wider">Texte IA</span>
                    {aiModel && aiModel !== 'fallback' && (
                      <span className="text-[9px] text-white/20 ml-1.5">({aiModel.split('/')[1]?.split(':')[0]})</span>
                    )}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={generateAiText}
                  disabled={aiLoading}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-orange-400 transition-colors disabled:opacity-30"
                  title="Regénérer un nouveau texte"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                </motion.button>
              </div>

              {aiLoading ? (
                <div className="space-y-2.5">
                  <div className="h-4 rounded-full bg-white/[0.06] animate-pulse w-full" />
                  <div className="h-4 rounded-full bg-white/[0.04] animate-pulse w-4/5" />
                  <div className="flex items-center gap-2 mt-2">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/10"
                    >
                      <Sparkles className="w-3 h-3 text-orange-400" />
                      <span className="text-[10px] text-orange-400/70 font-medium">Rédaction en cours...</span>
                    </motion.div>
                  </div>
                </div>
              ) : aiText ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-sm text-white/80 leading-relaxed font-medium italic">
                    &ldquo;{aiText}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyToClipboard(`${aiText} 👉 ${shareLink}`, 'ai')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/20 hover:border-orange-500/40 transition-colors"
                    >
                      {copied === 'ai' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-orange-400" />
                      )}
                      <span className="text-[10px] font-semibold text-orange-400/80">
                        {copied === 'ai' ? 'Copié !' : 'Copier'}
                      </span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => shareToWhatsApp(`${aiText} 👉 ${shareLink}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 hover:border-emerald-500/30 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-semibold text-emerald-400/80">WhatsApp</span>
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <p className="text-[11px] text-white/30 italic">Cliquez sur ↻ pour générer un texte</p>
              )}
            </div>
          </motion.div>

          {/* Product Image Preview */}
          {product.imageUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-2xl overflow-hidden border border-white/10"
            >
              <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-orange-500/5 via-pink-500/5 to-purple-500/5">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{product.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">Prix client : {formatPrice(finalPrice)}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ImageIcon className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400/70">Image jointe au partage</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Share with image button (native Web Share API) */}
          {product.imageUrl && nativeShareSupported && (
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                onClick={shareWithImage}
                disabled={imageLoading}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
                  animate={imageLoading ? {} : { opacity: [0, 0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ filter: 'blur(15px)' }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  {imageLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {imageLoading ? "Chargement de l'image..." : "Partager avec l'image"}
                </span>
              </Button>
            </motion.div>
          )}

          {/* Share link */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Votre lien de recommandation</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/50 text-xs truncate font-mono">
                {shareLink}
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(shareLink, 'link')}
                  className="h-10 px-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-semibold"
                >
                  {copied === 'link' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Social sharing */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Partager sur les réseaux</Label>
            <div className="grid grid-cols-3 gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => shareToWhatsApp(marketingMessages[0].message)}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={shareToFacebook}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-blue-600/20 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-600/30 transition-colors"
              >
                <Users className="w-4 h-4" />
                Facebook
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={shareToTwitter}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-sky-600/20 border border-sky-500/20 text-sky-400 text-xs font-semibold hover:bg-sky-600/30 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Twitter
              </motion.button>
            </div>
          </div>

          {/* Marketing messages */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Messages marketing prêts à copier</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {marketingMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-orange-500/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-orange-400/70">{msg.label}</span>
                      <p className="text-[11px] text-white/50 leading-relaxed mt-0.5 line-clamp-3">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyToClipboard(msg.message, `msg-${i}`)}
                        className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
                      >
                        {copied === `msg-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => shareToWhatsApp(msg.message)}
                        className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400/50 hover:text-emerald-400 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* QR Code placeholder */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center space-y-2">
            <div className="w-24 h-24 mx-auto rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="grid grid-cols-5 gap-0.5 w-16 h-16">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${seededRandom(i + 42) > 0.4 ? 'bg-white/20' : 'bg-transparent'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-white/30">QR Code de votre lien</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(shareLink, 'qr')}
              className="border-white/10 hover:bg-white/5 text-white/50 text-xs h-8"
            >
              {copied === 'qr' ? <Check className="w-3 h-3 mr-1 text-emerald-400" /> : <Copy className="w-3 h-3 mr-1" />}
              Copier le lien
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
