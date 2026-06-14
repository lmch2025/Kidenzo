'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Award, Star, Target, Gift, Plus, Pencil, Trash2,
  RefreshCw, Zap, Coins, Sparkles, ShieldCheck, ToggleLeft, ToggleRight,
  Swords, Flame, CalendarDays, Crown, CircleDot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ─── Types ──────────────────────────────────────────────────────────────────

interface BadgeData {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  threshold: number
  xpReward: number
  coinReward: number
}

interface AchievementData {
  id: string
  name: string
  description: string
  icon: string
  category: string
  threshold: number
  xpReward: number
  coinReward: number
}

interface QuestData {
  id: string
  name: string
  description: string
  icon: string
  category: string
  type: string
  threshold: number
  xpReward: number
  coinReward: number
  dayOfWeek: number | null
  active: boolean
}

interface RewardData {
  id: string
  name: string
  description: string
  icon: string
  category: string
  coinCost: number
  xpBonus: number
  rarity: string
  active: boolean
}

interface GamificationConfig {
  badges: BadgeData[]
  achievements: AchievementData[]
  dailyQuests: QuestData[]
  rewards: RewardData[]
}

type SubTab = 'badges' | 'achievements' | 'quests' | 'rewards'

const CATEGORIES = ['sale', 'social', 'streak', 'milestone', 'special', 'daily', 'weekly'] as const
const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const
const QUEST_TYPES = ['daily', 'weekly'] as const
const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const

const CATEGORY_LABELS: Record<string, string> = {
  sale: 'Ventes',
  social: 'Social',
  streak: 'Série',
  milestone: 'Jalon',
  special: 'Spécial',
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  cosmetic: 'Cosmétique',
  boost: 'Bonus',
}

const RARITY_LABELS: Record<string, string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400 border-gray-500/30 bg-gray-500/10',
  rare: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  epic: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  legendary: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
}

const RARITY_GLOW: Record<string, string> = {
  common: '',
  rare: 'shadow-blue-500/10',
  epic: 'shadow-purple-500/10',
  legendary: 'shadow-yellow-500/10',
}

const RARITY_DOT: Record<string, string> = {
  common: 'bg-gray-400',
  rare: 'bg-blue-400',
  epic: 'bg-purple-400',
  legendary: 'bg-yellow-400',
}

const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: 'badges', label: 'Badges', icon: Award },
  { id: 'achievements', label: 'Succès', icon: Star },
  { id: 'quests', label: 'Quêtes', icon: Target },
  { id: 'rewards', label: 'Récompenses', icon: Gift },
]

// ─── Icon Map ───────────────────────────────────────────────────────────────

const ICON_OPTIONS = [
  'Award', 'Star', 'Trophy', 'Shield', 'Zap', 'Flame', 'Crown',
  'Target', 'Gift', 'Coins', 'Sparkles', 'Swords', 'CalendarDays',
  'CircleDot', 'Heart', 'Gem', 'Rocket', 'Lightning',
] as const

const ICON_MAP: Record<string, React.ElementType> = {
  Award, Star, Trophy, Shield: ShieldCheck, Zap, Flame, Crown,
  Target, Gift, Coins, Sparkles, Swords, CalendarDays, CircleDot,
}

function IconRenderer({ icon, className }: { icon: string; className?: string }) {
  const IconComp = ICON_MAP[icon] || Award
  return <IconComp className={className} />
}

// ─── Skeletons ──────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="glass-card rounded-xl p-4 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/8" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-full bg-white/8" />
        <div className="h-5 w-20 rounded-full bg-white/8" />
      </div>
      <div className="flex gap-2">
        <div className="h-7 flex-1 rounded-lg bg-white/8" />
        <div className="h-7 w-8 rounded-lg bg-white/8" />
        <div className="h-7 w-8 rounded-lg bg-white/8" />
      </div>
    </div>
  )
}

// ─── Badge Form ─────────────────────────────────────────────────────────────

interface BadgeFormData {
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  threshold: number
  xpReward: number
  coinReward: number
}

const defaultBadgeForm: BadgeFormData = {
  name: '', description: '', icon: 'Award', category: 'sale',
  rarity: 'common', threshold: 1, xpReward: 10, coinReward: 5,
}

function BadgeFormDialog({
  open, onOpenChange, formData, setFormData, onSubmit, isEditing, isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: BadgeFormData
  setFormData: (data: BadgeFormData) => void
  onSubmit: () => void
  isEditing: boolean
  isSubmitting: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/10 sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text-warm flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-400" />
            {isEditing ? 'Modifier le badge' : 'Nouveau badge'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? 'Modifiez les propriétés du badge' : 'Créez un nouveau badge pour récompenser les utilisateurs'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">Nom</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom du badge"
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du badge"
              className="bg-white/5 border-white/10 min-h-[60px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Icône</Label>
              <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {ICON_OPTIONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <span className="flex items-center gap-2">
                        <IconRenderer icon={icon} className="w-3.5 h-3.5" />
                        {icon}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Catégorie</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Rareté</Label>
            <div className="grid grid-cols-4 gap-2">
              {RARITIES.map((r) => (
                <motion.button
                  key={r}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setFormData({ ...formData, rarity: r })}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                    formData.rarity === r
                      ? RARITY_COLORS[r]
                      : 'border-white/10 text-muted-foreground hover:border-white/20'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${RARITY_DOT[r]}`} />
                  {RARITY_LABELS[r]}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Seuil</Label>
              <Input
                type="number"
                min={0}
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">XP</Label>
              <Input
                type="number"
                min={0}
                value={formData.xpReward}
                onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Pièces</Label>
              <Input
                type="number"
                min={0}
                value={formData.coinReward}
                onChange={(e) => setFormData({ ...formData, coinReward: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 hover:bg-white/5">
            Annuler
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !formData.name}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white border-0"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              'Enregistrer'
            ) : (
              'Créer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Achievement Form ───────────────────────────────────────────────────────

interface AchievementFormData {
  name: string
  description: string
  icon: string
  category: string
  threshold: number
  xpReward: number
  coinReward: number
}

const defaultAchievementForm: AchievementFormData = {
  name: '', description: '', icon: 'Star', category: 'sale',
  threshold: 1, xpReward: 25, coinReward: 10,
}

function AchievementFormDialog({
  open, onOpenChange, formData, setFormData, onSubmit, isEditing, isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: AchievementFormData
  setFormData: (data: AchievementFormData) => void
  onSubmit: () => void
  isEditing: boolean
  isSubmitting: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/10 sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text-warm flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            {isEditing ? 'Modifier le succès' : 'Nouveau succès'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? 'Modifiez les propriétés du succès' : 'Créez un nouveau succès à débloquer'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">Nom</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom du succès"
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du succès"
              className="bg-white/5 border-white/10 min-h-[60px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Icône</Label>
              <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {ICON_OPTIONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <span className="flex items-center gap-2">
                        <IconRenderer icon={icon} className="w-3.5 h-3.5" />
                        {icon}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Catégorie</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Seuil</Label>
              <Input
                type="number"
                min={0}
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">XP</Label>
              <Input
                type="number"
                min={0}
                value={formData.xpReward}
                onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Pièces</Label>
              <Input
                type="number"
                min={0}
                value={formData.coinReward}
                onChange={(e) => setFormData({ ...formData, coinReward: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 hover:bg-white/5">
            Annuler
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !formData.name}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              'Enregistrer'
            ) : (
              'Créer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Quest Form ─────────────────────────────────────────────────────────────

interface QuestFormData {
  name: string
  description: string
  icon: string
  category: string
  type: string
  threshold: number
  xpReward: number
  coinReward: number
  dayOfWeek: number | null
  active: boolean
}

const defaultQuestForm: QuestFormData = {
  name: '', description: '', icon: 'Target', category: 'daily',
  type: 'daily', threshold: 1, xpReward: 15, coinReward: 5,
  dayOfWeek: null, active: true,
}

function QuestFormDialog({
  open, onOpenChange, formData, setFormData, onSubmit, isEditing, isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: QuestFormData
  setFormData: (data: QuestFormData) => void
  onSubmit: () => void
  isEditing: boolean
  isSubmitting: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/10 sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text-warm flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            {isEditing ? 'Modifier la quête' : 'Nouvelle quête'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? 'Modifiez les propriétés de la quête' : 'Créez une nouvelle quête quotidienne ou hebdomadaire'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">Nom</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom de la quête"
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la quête"
              className="bg-white/5 border-white/10 min-h-[60px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Icône</Label>
              <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {ICON_OPTIONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <span className="flex items-center gap-2">
                        <IconRenderer icon={icon} className="w-3.5 h-3.5" />
                        {icon}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Catégorie</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v, dayOfWeek: v === 'daily' ? null : formData.dayOfWeek })}>
                <SelectTrigger className="bg-white/5 border-white/10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {QUEST_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === 'daily' ? 'Quotidienne' : 'Hebdomadaire'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'weekly' && (
              <div className="space-y-2">
                <Label className="text-xs">Jour de la semaine</Label>
                <Select
                  value={formData.dayOfWeek !== null ? formData.dayOfWeek.toString() : '0'}
                  onValueChange={(v) => setFormData({ ...formData, dayOfWeek: parseInt(v) })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-white/10">
                    {DAYS_OF_WEEK.map((day, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Seuil</Label>
              <Input
                type="number"
                min={0}
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">XP</Label>
              <Input
                type="number"
                min={0}
                value={formData.xpReward}
                onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Pièces</Label>
              <Input
                type="number"
                min={0}
                value={formData.coinReward}
                onChange={(e) => setFormData({ ...formData, coinReward: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-between py-2">
              <Label className="text-xs">Active</Label>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 hover:bg-white/5">
            Annuler
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !formData.name}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              'Enregistrer'
            ) : (
              'Créer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Reward Form ────────────────────────────────────────────────────────────

interface RewardFormData {
  name: string
  description: string
  icon: string
  category: string
  coinCost: number
  xpBonus: number
  rarity: string
  active: boolean
}

const defaultRewardForm: RewardFormData = {
  name: '', description: '', icon: 'Gift', category: 'cosmetic',
  coinCost: 50, xpBonus: 0, rarity: 'common', active: true,
}

function RewardFormDialog({
  open, onOpenChange, formData, setFormData, onSubmit, isEditing, isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: RewardFormData
  setFormData: (data: RewardFormData) => void
  onSubmit: () => void
  isEditing: boolean
  isSubmitting: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/10 sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text-warm flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-400" />
            {isEditing ? 'Modifier la récompense' : 'Nouvelle récompense'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? 'Modifiez les propriétés de la récompense' : 'Créez une nouvelle récompense pour la boutique'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">Nom</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom de la récompense"
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la récompense"
              className="bg-white/5 border-white/10 min-h-[60px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Icône</Label>
              <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {ICON_OPTIONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <span className="flex items-center gap-2">
                        <IconRenderer icon={icon} className="w-3.5 h-3.5" />
                        {icon}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Catégorie</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {['cosmetic', 'boost', 'special'].map((cat) => (
                    <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Rareté</Label>
            <div className="grid grid-cols-4 gap-2">
              {RARITIES.map((r) => (
                <motion.button
                  key={r}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setFormData({ ...formData, rarity: r })}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                    formData.rarity === r
                      ? RARITY_COLORS[r]
                      : 'border-white/10 text-muted-foreground hover:border-white/20'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${RARITY_DOT[r]}`} />
                  {RARITY_LABELS[r]}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Coût en pièces</Label>
              <Input
                type="number"
                min={0}
                value={formData.coinCost}
                onChange={(e) => setFormData({ ...formData, coinCost: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Bonus XP</Label>
              <Input
                type="number"
                min={0}
                value={formData.xpBonus}
                onChange={(e) => setFormData({ ...formData, xpBonus: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-between py-2">
              <Label className="text-xs">Active</Label>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 hover:bg-white/5">
            Annuler
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !formData.name}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              'Enregistrer'
            ) : (
              'Créer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Item Card ──────────────────────────────────────────────────────────────

interface ItemCardProps {
  children: React.ReactNode
  index: number
}

function ItemCard({ children, index }: ItemCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="glass-card rounded-xl p-4 group"
    >
      {children}
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminGamification() {
  const [config, setConfig] = useState<GamificationConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<SubTab>('badges')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Badge dialog
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false)
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null)
  const [badgeForm, setBadgeForm] = useState<BadgeFormData>(defaultBadgeForm)

  // Achievement dialog
  const [achievementDialogOpen, setAchievementDialogOpen] = useState(false)
  const [editingAchievementId, setEditingAchievementId] = useState<string | null>(null)
  const [achievementForm, setAchievementForm] = useState<AchievementFormData>(defaultAchievementForm)

  // Quest dialog
  const [questDialogOpen, setQuestDialogOpen] = useState(false)
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null)
  const [questForm, setQuestForm] = useState<QuestFormData>(defaultQuestForm)

  // Reward dialog
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false)
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null)
  const [rewardForm, setRewardForm] = useState<RewardFormData>(defaultRewardForm)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'badge' | 'achievement'; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toggling states
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // ─── Fetch config ────────────────────────────────────────────────────────

  const fetchConfig = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin?action=gamification-config')
      if (res.ok) {
        const data = await res.json()
        setConfig({
          badges: data.badges || [],
          achievements: data.achievements || [],
          dailyQuests: data.dailyQuests || [],
          rewards: data.rewards || [],
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConfig()
  }, [fetchConfig])

  // ─── Generic POST helper ─────────────────────────────────────────────────

  const adminPost = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res
  }

  // ─── Badge actions ───────────────────────────────────────────────────────

  const openNewBadge = () => {
    setEditingBadgeId(null)
    setBadgeForm(defaultBadgeForm)
    setBadgeDialogOpen(true)
  }

  const openEditBadge = (badge: BadgeData) => {
    setEditingBadgeId(badge.id)
    setBadgeForm({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      rarity: badge.rarity,
      threshold: badge.threshold,
      xpReward: badge.xpReward,
      coinReward: badge.coinReward,
    })
    setBadgeDialogOpen(true)
  }

  const handleBadgeSubmit = async () => {
    setIsSubmitting(true)
    try {
      const action = editingBadgeId ? 'update-badge' : 'create-badge'
      const body: Record<string, unknown> = { action, ...badgeForm }
      if (editingBadgeId) body.id = editingBadgeId

      const res = await adminPost(body)
      if (res.ok) {
        setBadgeDialogOpen(false)
        await fetchConfig()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBadge = async (id: string) => {
    setIsDeleting(true)
    try {
      const res = await adminPost({ action: 'delete-badge', id })
      if (res.ok) {
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
        await fetchConfig()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // ─── Achievement actions ─────────────────────────────────────────────────

  const openNewAchievement = () => {
    setEditingAchievementId(null)
    setAchievementForm(defaultAchievementForm)
    setAchievementDialogOpen(true)
  }

  const openEditAchievement = (ach: AchievementData) => {
    setEditingAchievementId(ach.id)
    setAchievementForm({
      name: ach.name,
      description: ach.description,
      icon: ach.icon,
      category: ach.category,
      threshold: ach.threshold,
      xpReward: ach.xpReward,
      coinReward: ach.coinReward,
    })
    setAchievementDialogOpen(true)
  }

  const handleAchievementSubmit = async () => {
    setIsSubmitting(true)
    try {
      const action = editingAchievementId ? 'update-achievement' : 'create-achievement'
      const body: Record<string, unknown> = { action, ...achievementForm }
      if (editingAchievementId) body.id = editingAchievementId

      const res = await adminPost(body)
      if (res.ok) {
        setAchievementDialogOpen(false)
        await fetchConfig()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAchievement = async (id: string) => {
    setIsDeleting(true)
    try {
      const res = await adminPost({ action: 'delete-achievement', id })
      if (res.ok) {
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
        await fetchConfig()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // ─── Quest actions ───────────────────────────────────────────────────────

  const openNewQuest = () => {
    setEditingQuestId(null)
    setQuestForm(defaultQuestForm)
    setQuestDialogOpen(true)
  }

  const openEditQuest = (quest: QuestData) => {
    setEditingQuestId(quest.id)
    setQuestForm({
      name: quest.name,
      description: quest.description,
      icon: quest.icon,
      category: quest.category,
      type: quest.type,
      threshold: quest.threshold,
      xpReward: quest.xpReward,
      coinReward: quest.coinReward,
      dayOfWeek: quest.dayOfWeek,
      active: quest.active,
    })
    setQuestDialogOpen(true)
  }

  const handleQuestSubmit = async () => {
    setIsSubmitting(true)
    try {
      const action = editingQuestId ? 'update-quest' : 'create-quest'
      const body: Record<string, unknown> = { action, ...questForm }
      if (editingQuestId) body.id = editingQuestId

      const res = await adminPost(body)
      if (res.ok) {
        setQuestDialogOpen(false)
        await fetchConfig()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleQuest = async (id: string) => {
    setTogglingId(id)
    try {
      const res = await adminPost({ action: 'toggle-quest', id })
      if (res.ok) {
        await fetchConfig()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setTogglingId(null)
    }
  }

  // ─── Reward actions ──────────────────────────────────────────────────────

  const openNewReward = () => {
    setEditingRewardId(null)
    setRewardForm(defaultRewardForm)
    setRewardDialogOpen(true)
  }

  const openEditReward = (reward: RewardData) => {
    setEditingRewardId(reward.id)
    setRewardForm({
      name: reward.name,
      description: reward.description,
      icon: reward.icon,
      category: reward.category,
      coinCost: reward.coinCost,
      xpBonus: reward.xpBonus,
      rarity: reward.rarity,
      active: reward.active,
    })
    setRewardDialogOpen(true)
  }

  const handleRewardSubmit = async () => {
    setIsSubmitting(true)
    try {
      const action = editingRewardId ? 'update-reward' : 'create-reward'
      const body: Record<string, unknown> = { action, ...rewardForm }
      if (editingRewardId) body.id = editingRewardId

      const res = await adminPost(body)
      if (res.ok) {
        setRewardDialogOpen(false)
        await fetchConfig()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleReward = async (id: string) => {
    setTogglingId(id)
    try {
      const res = await adminPost({ action: 'toggle-reward', id })
      if (res.ok) {
        await fetchConfig()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setTogglingId(null)
    }
  }

  // ─── Stats summary ───────────────────────────────────────────────────────

  const stats = config ? [
    { label: 'Badges', value: config.badges.length, icon: Award, color: 'text-orange-400' },
    { label: 'Succès', value: config.achievements.length, icon: Star, color: 'text-yellow-400' },
    { label: 'Quêtes', value: config.dailyQuests.length, icon: Target, color: 'text-emerald-400' },
    { label: 'Récompenses', value: config.rewards.length, icon: Gift, color: 'text-pink-400' },
  ] : []

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.h2
          className="text-xl font-bold gradient-text-warm flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Trophy className="w-6 h-6 text-orange-400" />
          Configuration Gamification
        </motion.h2>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchConfig}
            className="border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      {config && (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                className="glass-card rounded-xl p-3 text-center"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1.5 ${stat.color}`} />
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {SUB_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500/20 via-pink-500/10 to-purple-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {config && (
                <span className="text-[10px] opacity-60 ml-0.5">
                  ({tab.id === 'badges' ? config.badges.length : tab.id === 'achievements' ? config.achievements.length : tab.id === 'quests' ? config.dailyQuests.length : config.rewards.length})
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── Badges Tab ─────────────────────────────────────────── */}
            {activeTab === 'badges' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      onClick={openNewBadge}
                      className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg shadow-orange-500/20"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Nouveau badge
                    </Button>
                  </motion.div>
                </div>

                {config && config.badges.length === 0 ? (
                  <div className="glass rounded-xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                      <Award className="w-8 h-8 text-orange-400/40" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Aucun badge</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Créez des badges pour récompenser vos utilisateurs
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {config?.badges.map((badge, i) => (
                        <ItemCard key={badge.id} index={i}>
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${RARITY_COLORS[badge.rarity]} ${RARITY_GLOW[badge.rarity]} shadow-lg`}>
                                <IconRenderer icon={badge.icon} className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-orange-400 transition-colors">
                                  {badge.name}
                                </h4>
                                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                  {badge.description}
                                </p>
                              </div>
                            </div>

                            {/* Badges row */}
                            <div className="flex flex-wrap gap-1.5">
                              <Badge className={`text-[9px] font-semibold border ${RARITY_COLORS[badge.rarity]}`}>
                                <div className={`w-1.5 h-1.5 rounded-full mr-1 ${RARITY_DOT[badge.rarity]}`} />
                                {RARITY_LABELS[badge.rarity]}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground">
                                {CATEGORY_LABELS[badge.category] || badge.category}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground">
                                Seuil: {badge.threshold}
                              </Badge>
                            </div>

                            {/* Rewards */}
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="flex items-center gap-1 text-blue-400">
                                <Zap className="w-3 h-3" />
                                {badge.xpReward} XP
                              </span>
                              <span className="flex items-center gap-1 text-yellow-400">
                                <Coins className="w-3 h-3" />
                                {badge.coinReward} pièces
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openEditBadge(badge)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-all flex-1"
                              >
                                <Pencil className="w-3 h-3" />
                                Modifier
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setDeleteTarget({ id: badge.id, type: 'badge', name: badge.name })
                                  setDeleteDialogOpen(true)
                                }}
                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </div>
                        </ItemCard>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* ── Achievements Tab ────────────────────────────────────── */}
            {activeTab === 'achievements' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      onClick={openNewAchievement}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg shadow-yellow-500/20"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Nouveau succès
                    </Button>
                  </motion.div>
                </div>

                {config && config.achievements.length === 0 ? (
                  <div className="glass rounded-xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                      <Star className="w-8 h-8 text-yellow-400/40" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Aucun succès</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Créez des succès à débloquer pour vos utilisateurs
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {config?.achievements.map((ach, i) => (
                        <ItemCard key={ach.id} index={i}>
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center border bg-yellow-500/10 border-yellow-500/30 shadow-lg shadow-yellow-500/10">
                                <IconRenderer icon={ach.icon} className="w-5 h-5 text-yellow-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-yellow-400 transition-colors">
                                  {ach.name}
                                </h4>
                                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                  {ach.description}
                                </p>
                              </div>
                            </div>

                            {/* Badges row */}
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground">
                                {CATEGORY_LABELS[ach.category] || ach.category}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground">
                                Seuil: {ach.threshold}
                              </Badge>
                            </div>

                            {/* Rewards */}
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="flex items-center gap-1 text-blue-400">
                                <Zap className="w-3 h-3" />
                                {ach.xpReward} XP
                              </span>
                              <span className="flex items-center gap-1 text-yellow-400">
                                <Coins className="w-3 h-3" />
                                {ach.coinReward} pièces
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openEditAchievement(ach)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all flex-1"
                              >
                                <Pencil className="w-3 h-3" />
                                Modifier
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setDeleteTarget({ id: ach.id, type: 'achievement', name: ach.name })
                                  setDeleteDialogOpen(true)
                                }}
                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </div>
                        </ItemCard>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* ── Quests Tab ──────────────────────────────────────────── */}
            {activeTab === 'quests' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      onClick={openNewQuest}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Nouvelle quête
                    </Button>
                  </motion.div>
                </div>

                {config && config.dailyQuests.length === 0 ? (
                  <div className="glass rounded-xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <Target className="w-8 h-8 text-emerald-400/40" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Aucune quête</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Créez des quêtes quotidiennes ou hebdomadaires
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {config?.dailyQuests.map((quest, i) => (
                        <ItemCard key={quest.id} index={i}>
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                                quest.type === 'daily'
                                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                                  : 'bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/10'
                              }`}>
                                <IconRenderer icon={quest.icon} className={`w-5 h-5 ${quest.type === 'daily' ? 'text-emerald-400' : 'text-purple-400'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-emerald-400 transition-colors">
                                  {quest.name}
                                </h4>
                                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                  {quest.description}
                                </p>
                              </div>
                              {/* Active indicator */}
                              <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                quest.active
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-red-500/15 text-red-400'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${quest.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                {quest.active ? 'Active' : 'Inactive'}
                              </div>
                            </div>

                            {/* Badges row */}
                            <div className="flex flex-wrap gap-1.5">
                              <Badge className={`text-[9px] font-semibold border ${
                                quest.type === 'daily'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              }`}>
                                {quest.type === 'daily' ? 'Quotidienne' : 'Hebdomadaire'}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground">
                                {CATEGORY_LABELS[quest.category] || quest.category}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground">
                                Seuil: {quest.threshold}
                              </Badge>
                              {quest.dayOfWeek !== null && (
                                <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground">
                                  {DAYS_OF_WEEK[quest.dayOfWeek]}
                                </Badge>
                              )}
                            </div>

                            {/* Rewards */}
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="flex items-center gap-1 text-blue-400">
                                <Zap className="w-3 h-3" />
                                {quest.xpReward} XP
                              </span>
                              <span className="flex items-center gap-1 text-yellow-400">
                                <Coins className="w-3 h-3" />
                                {quest.coinReward} pièces
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openEditQuest(quest)}
                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                              >
                                <Pencil className="w-3 h-3" />
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleToggleQuest(quest.id)}
                                disabled={togglingId === quest.id}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 disabled:opacity-50 ${
                                  quest.active
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                }`}
                              >
                                {togglingId === quest.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : quest.active ? (
                                  <ToggleRight className="w-3 h-3" />
                                ) : (
                                  <ToggleLeft className="w-3 h-3" />
                                )}
                                {quest.active ? 'Désactiver' : 'Activer'}
                              </motion.button>
                            </div>
                          </div>
                        </ItemCard>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* ── Rewards Tab ─────────────────────────────────────────── */}
            {activeTab === 'rewards' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="sm"
                      onClick={openNewReward}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-pink-500/20"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Nouvelle récompense
                    </Button>
                  </motion.div>
                </div>

                {config && config.rewards.length === 0 ? (
                  <div className="glass rounded-xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                      <Gift className="w-8 h-8 text-pink-400/40" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Aucune récompense</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Créez des récompenses pour la boutique
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {config?.rewards.map((reward, i) => (
                        <ItemCard key={reward.id} index={i}>
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${RARITY_COLORS[reward.rarity]} ${RARITY_GLOW[reward.rarity]} shadow-lg`}>
                                <IconRenderer icon={reward.icon} className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-pink-400 transition-colors">
                                  {reward.name}
                                </h4>
                                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                  {reward.description}
                                </p>
                              </div>
                              {/* Active indicator */}
                              <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                reward.active
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-red-500/15 text-red-400'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${reward.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                {reward.active ? 'Active' : 'Inactive'}
                              </div>
                            </div>

                            {/* Badges row */}
                            <div className="flex flex-wrap gap-1.5">
                              <Badge className={`text-[9px] font-semibold border ${RARITY_COLORS[reward.rarity]}`}>
                                <div className={`w-1.5 h-1.5 rounded-full mr-1 ${RARITY_DOT[reward.rarity]}`} />
                                {RARITY_LABELS[reward.rarity]}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground">
                                {CATEGORY_LABELS[reward.category] || reward.category}
                              </Badge>
                            </div>

                            {/* Cost & Bonus */}
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="flex items-center gap-1 text-yellow-400">
                                <Coins className="w-3 h-3" />
                                {reward.coinCost} pièces
                              </span>
                              {reward.xpBonus > 0 && (
                                <span className="flex items-center gap-1 text-blue-400">
                                  <Zap className="w-3 h-3" />
                                  +{reward.xpBonus} XP
                                </span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-1">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openEditReward(reward)}
                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20 transition-all"
                              >
                                <Pencil className="w-3 h-3" />
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleToggleReward(reward.id)}
                                disabled={togglingId === reward.id}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 disabled:opacity-50 ${
                                  reward.active
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                }`}
                              >
                                {togglingId === reward.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : reward.active ? (
                                  <ToggleRight className="w-3 h-3" />
                                ) : (
                                  <ToggleLeft className="w-3 h-3" />
                                )}
                                {reward.active ? 'Désactiver' : 'Activer'}
                              </motion.button>
                            </div>
                          </div>
                        </ItemCard>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge Form Dialog */}
      <BadgeFormDialog
        open={badgeDialogOpen}
        onOpenChange={setBadgeDialogOpen}
        formData={badgeForm}
        setFormData={setBadgeForm}
        onSubmit={handleBadgeSubmit}
        isEditing={!!editingBadgeId}
        isSubmitting={isSubmitting}
      />

      {/* Achievement Form Dialog */}
      <AchievementFormDialog
        open={achievementDialogOpen}
        onOpenChange={setAchievementDialogOpen}
        formData={achievementForm}
        setFormData={setAchievementForm}
        onSubmit={handleAchievementSubmit}
        isEditing={!!editingAchievementId}
        isSubmitting={isSubmitting}
      />

      {/* Quest Form Dialog */}
      <QuestFormDialog
        open={questDialogOpen}
        onOpenChange={setQuestDialogOpen}
        formData={questForm}
        setFormData={setQuestForm}
        onSubmit={handleQuestSubmit}
        isEditing={!!editingQuestId}
        isSubmitting={isSubmitting}
      />

      {/* Reward Form Dialog */}
      <RewardFormDialog
        open={rewardDialogOpen}
        onOpenChange={setRewardDialogOpen}
        formData={rewardForm}
        setFormData={setRewardForm}
        onSubmit={handleRewardSubmit}
        isEditing={!!editingRewardId}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-strong border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="gradient-text-warm">
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer <strong className="text-foreground">{deleteTarget?.name}</strong> ?
              Cette action est irréversible. Toutes les données associées seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 hover:bg-white/5">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  if (deleteTarget.type === 'badge') handleDeleteBadge(deleteTarget.id)
                  else if (deleteTarget.type === 'achievement') handleDeleteAchievement(deleteTarget.id)
                }
              }}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0"
            >
              {isDeleting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                'Supprimer définitivement'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
