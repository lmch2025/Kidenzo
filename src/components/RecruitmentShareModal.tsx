'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Share2,
  Copy,
  Check,
  Users,
  MessageSquare,
  Loader2,
  RefreshCw,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import QRCode from 'react-qr-code'

export function RecruitmentShareModal({
  open,
  onClose,
  shareLink,
}: {
  open: boolean
  onClose: () => void
  shareLink: string
}) {
  const [copied, setCopied] = useState<string | null>(null)
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
          type: 'recruitment',
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
      console.error('Failed to generate AI recruitment text:', err)
    } finally {
      setAiLoading(false)
    }
  }, [shareLink])

  // Auto-generate when modal opens
  useEffect(() => {
    if (open) {
      generateAiText()
    }
    if (!open) {
      setAiText(null)
      setAiModel(null)
    }
  }, [open, generateAiText])

  const marketingMessages = useMemo(() => {
    return [
      {
        label: '🚀 Motivation Simple',
        message: `Envie de gagner de l'argent depuis chez toi sans investissement ? Rejoins mon équipe sur Kidenzo dès aujourd'hui ! 👉 ${shareLink}`,
      },
      {
        label: '💰 Revenu Complémentaire',
        message: `Arrondis tes fins de mois facilement avec ton téléphone ! Deviens recommandeur dans mon équipe et commence à générer des revenus. Inscris-toi ici 👉 ${shareLink}`,
      },
      {
        label: "🤝 Esprit d'équipe",
        message: `Je recrute de nouveaux partenaires motivés ! Rejoins mon équipe Kidenzo, je t'accompagnerai pour tes premières ventes. C'est 100% gratuit ! 👉 ${shareLink}`,
      },
    ]
  }, [shareLink])

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
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Rejoignez mon équipe sur Kidenzo et gagnez un revenu depuis votre téléphone !`)}&url=${encodeURIComponent(shareLink)}`, '_blank')
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="bg-[#0d0118]/98 backdrop-blur-2xl border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-white text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Recruter une équipe
          </SheetTitle>
          <SheetDescription className="text-white/50">
            Partagez ce lien pour inviter de nouveaux recommandeurs et gagner des bonus sur leurs ventes !
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pt-4">
          {/* ── AI-Generated Marketing Text (HERO SECTION) ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden border border-purple-500/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-orange-500/5" />
            <div className="relative p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-400/80 uppercase tracking-wider">Texte de recrutement IA</span>
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
                  className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-purple-400 transition-colors disabled:opacity-30"
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
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/10"
                    >
                      <Wand2 className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] text-purple-400/70 font-medium">Rédaction en cours...</span>
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-colors"
                    >
                      {copied === 'ai' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-purple-400" />
                      )}
                      <span className="text-[10px] font-semibold text-purple-400/80">
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

          {/* Share link */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Lien d'inscription (Code parrain auto-intégré)</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/50 text-xs truncate font-mono">
                {shareLink}
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(shareLink, 'link')}
                  className="h-10 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold"
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
            <Label className="text-white/60 text-xs">Exemples de messages prêts à envoyer</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {marketingMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-purple-400/70">{msg.label}</span>
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

          {/* QR Code */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center space-y-2">
            <div className="p-2 w-32 h-32 mx-auto rounded-xl bg-white flex items-center justify-center">
              <QRCode
                value={shareLink}
                size={112}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>
            <p className="text-[10px] text-white/30">Faites scanner ce code pour recruter en direct</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
