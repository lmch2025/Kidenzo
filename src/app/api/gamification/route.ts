import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Spin Wheel Segments (with weights as specified) ───────────────────
const SPIN_SEGMENTS = [
  { label: '10 XP', xp: 10, coins: 0, color: '#f97316', weight: 30 },
  { label: '25 XP', xp: 25, coins: 0, color: '#ec4899', weight: 25 },
  { label: '5 Pièces', xp: 0, coins: 5, color: '#a855f7', weight: 20 },
  { label: '50 XP', xp: 50, coins: 0, color: '#06b6d4', weight: 12 },
  { label: '15 Pièces', xp: 0, coins: 15, color: '#10b981', weight: 8 },
  { label: '100 XP', xp: 100, coins: 0, color: '#f43f5e', weight: 3 },
  { label: '50 Pièces', xp: 0, coins: 50, color: '#fbbf24', weight: 1.5 },
  { label: '200 XP + 20 Pièces', xp: 200, coins: 20, color: '#8b5cf6', weight: 0.5 },
]

const MAX_SPINS_PER_DAY = 3

// ─── Helpers ───────────────────────────────────────────────────────────

function weightedRandomSelect(segments: typeof SPIN_SEGMENTS): (typeof SPIN_SEGMENTS)[number] {
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0)
  let random = Math.random() * totalWeight
  for (const segment of segments) {
    random -= segment.weight
    if (random <= 0) return segment
  }
  return segments[segments.length - 1]
}

function getEndOfToday(): Date {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return end
}

function getStartOfToday(): Date {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  return start
}

function isSameDay(a: Date | null, b: Date): boolean {
  if (!a) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function calculateAchievementProgress(
  category: string,
  _threshold: number,
  user: { xp: number; level: number; streak: number },
  deliveredOrders: number
): number {
  switch (category) {
    case 'sale':
      return deliveredOrders
    case 'social':
      return deliveredOrders // Simplified
    case 'streak':
      return user.streak
    case 'milestone':
      return user.xp
    default:
      return deliveredOrders
  }
}

// ─── GET Handler ───────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const role = searchParams.get('role')

    // Leaderboard
    if (action === 'leaderboard') {
      return await handleGetLeaderboard(role)
    }

    // Rewards shop
    if (action === 'rewards') {
      return await handleGetRewards()
    }

    // Daily quests for a specific user
    if (action === 'dailyQuests') {
      if (!userId) {
        return NextResponse.json(
          { error: 'userId is required for dailyQuests action' },
          { status: 400 }
        )
      }
      return await handleGetDailyQuests(userId)
    }

    // Default: full user gamification data
    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    return await handleGetUserData(userId)
  } catch (error) {
    console.error('Gamification GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// ─── GET: Full User Data ───────────────────────────────────────────────

async function handleGetUserData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      xp: true,
      level: true,
      coins: true,
      streak: true,
      bestStreak: true,
      lastActiveAt: true,
    },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    )
  }

  // Get badges (with rarity, coinReward from Badge model)
  const badges = await db.userBadge.findMany({
    where: { userId },
    include: {
      badge: true,
    },
    orderBy: { earnedAt: 'desc' },
  })

  // Get achievements (with coinReward from Achievement model)
  const achievements = await db.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get user's daily quests (with quest data)
  const today = getStartOfToday()
  const dailyQuests = await db.userDailyQuest.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    include: {
      quest: true,
    },
    orderBy: { expiresAt: 'asc' },
  })

  // Auto-assign daily quests if user has none
  if (dailyQuests.length === 0) {
    const todayEnd = getEndOfToday()
    const activeDailyQuests = await db.dailyQuest.findMany({
      where: { type: 'daily', active: true },
    })
    for (const quest of activeDailyQuests) {
      const created = await db.userDailyQuest.create({
        data: {
          userId,
          questId: quest.id,
          progress: 0,
          completed: false,
          claimed: false,
          assignedAt: new Date(),
          expiresAt: todayEnd,
        },
        include: { quest: true },
      })
      dailyQuests.push(created)
    }
  }

  // Level progress calculation
  const currentLevelXP = (user.level - 1) * 500
  const nextLevelXP = user.level * 500
  const xpInCurrentLevel = user.xp - currentLevelXP
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP
  const levelProgress = (xpInCurrentLevel / xpNeededForNextLevel) * 100

  // Get order stats
  const totalOrders = await db.order.count({
    where: {
      recommenderId: userId,
      status: 'delivered',
    },
  })

  const totalSales = await db.order.aggregate({
    where: {
      recommenderId: userId,
      status: 'delivered',
    },
    _sum: {
      finalPrice: true,
      commissionRecommender: true,
    },
  })

  return NextResponse.json({
    user,
    badges: badges.map((b) => ({
      id: b.id,
      badge: {
        id: b.badge.id,
        name: b.badge.name,
        description: b.badge.description,
        icon: b.badge.icon,
        category: b.badge.category,
        rarity: b.badge.rarity,
        threshold: b.badge.threshold,
        xpReward: b.badge.xpReward,
        coinReward: b.badge.coinReward,
      },
      earnedAt: b.earnedAt,
    })),
    achievements: achievements.map((a) => ({
      id: a.id,
      achievement: {
        id: a.achievement.id,
        name: a.achievement.name,
        description: a.achievement.description,
        icon: a.achievement.icon,
        category: a.achievement.category,
        threshold: a.achievement.threshold,
        xpReward: a.achievement.xpReward,
        coinReward: a.achievement.coinReward,
      },
      progress: a.progress,
      completed: a.completed,
      completedAt: a.completedAt,
    })),
    dailyQuests: dailyQuests.map((dq) => ({
      id: dq.id,
      quest: {
        id: dq.quest.id,
        name: dq.quest.name,
        description: dq.quest.description,
        icon: dq.quest.icon,
        category: dq.quest.category,
        type: dq.quest.type,
        threshold: dq.quest.threshold,
        xpReward: dq.quest.xpReward,
        coinReward: dq.quest.coinReward,
      },
      progress: dq.progress,
      completed: dq.completed,
      claimed: dq.claimed,
      assignedAt: dq.assignedAt,
      expiresAt: dq.expiresAt,
    })),
    progress: {
      levelProgress: Math.min(levelProgress, 100),
      currentLevelXP,
      nextLevelXP,
      xpInCurrentLevel,
      xpNeededForNextLevel,
    },
    stats: {
      totalOrders,
      totalSales: totalSales._sum.finalPrice || 0,
      totalCommissions: totalSales._sum.commissionRecommender || 0,
    },
  })
}

// ─── GET: Leaderboard ──────────────────────────────────────────────────

async function handleGetLeaderboard(role?: string | null) {
  const where: any = role ? { role } : {}

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      xp: true,
      level: true,
      streak: true,
      _count: {
        select: {
          ordersAsRecommender: {
            where: { status: 'delivered' },
          },
        },
      },
    },
    orderBy: { xp: 'desc' },
    take: 50,
  })

  const leaderboard = users.map((user, index) => ({
    rank: index + 1,
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    deliveredOrders: user._count.ordersAsRecommender,
  }))

  return NextResponse.json({ leaderboard })
}

// ─── GET: Rewards ──────────────────────────────────────────────────────

async function handleGetRewards() {
  const rewards = await db.reward.findMany({
    where: { active: true },
    orderBy: [{ rarity: 'asc' }, { coinCost: 'asc' }],
  })

  return NextResponse.json({
    rewards: rewards.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      icon: r.icon,
      category: r.category,
      coinCost: r.coinCost,
      xpBonus: r.xpBonus,
      rarity: r.rarity,
    })),
  })
}

// ─── GET: Daily Quests (with auto-assign) ──────────────────────────────

async function handleGetDailyQuests(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    )
  }

  const todayStart = getStartOfToday()
  const todayEnd = getEndOfToday()

  // Check if user already has quests assigned for today
  const existingQuests = await db.userDailyQuest.findMany({
    where: {
      userId,
      assignedAt: { gte: todayStart },
    },
    include: {
      quest: true,
    },
  })

  if (existingQuests.length > 0) {
    return NextResponse.json({
      dailyQuests: existingQuests.map((dq) => ({
        id: dq.id,
        quest: {
          id: dq.quest.id,
          name: dq.quest.name,
          description: dq.quest.description,
          icon: dq.quest.icon,
          category: dq.quest.category,
          type: dq.quest.type,
          threshold: dq.quest.threshold,
          xpReward: dq.quest.xpReward,
          coinReward: dq.quest.coinReward,
        },
        progress: dq.progress,
        completed: dq.completed,
        claimed: dq.claimed,
        assignedAt: dq.assignedAt,
        expiresAt: dq.expiresAt,
      })),
    })
  }

  // Auto-assign: find all active daily quests of type "daily"
  const activeDailyQuests = await db.dailyQuest.findMany({
    where: {
      active: true,
      type: 'daily',
    },
  })

  const assignedQuests: any[] = []

  for (const quest of activeDailyQuests) {
    const userQuest = await db.userDailyQuest.create({
      data: {
        userId,
        questId: quest.id,
        progress: 0,
        completed: false,
        claimed: false,
        assignedAt: new Date(),
        expiresAt: todayEnd,
      },
      include: {
        quest: true,
      },
    })
    assignedQuests.push(userQuest)
  }

  return NextResponse.json({
    dailyQuests: assignedQuests.map((dq) => ({
      id: dq.id,
      quest: {
        id: dq.quest.id,
        name: dq.quest.name,
        description: dq.quest.description,
        icon: dq.quest.icon,
        category: dq.quest.category,
        type: dq.quest.type,
        threshold: dq.quest.threshold,
        xpReward: dq.quest.xpReward,
        coinReward: dq.quest.coinReward,
      },
      progress: dq.progress,
      completed: dq.completed,
      claimed: dq.claimed,
      assignedAt: dq.assignedAt,
      expiresAt: dq.expiresAt,
    })),
  })
}

// ─── POST Handler ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'awardXP':
        return await handleAwardXP(userId, body)
      case 'checkAchievements':
        return await handleCheckAchievements(userId)
      case 'claimQuest':
        return await handleClaimQuest(userId, body)
      case 'spin':
        return await handleSpin(userId)
      case 'buyReward':
        return await handleBuyReward(userId, body)
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: awardXP, checkAchievements, claimQuest, spin, buyReward` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Gamification POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── POST: Award XP ────────────────────────────────────────────────────

async function handleAwardXP(
  userId: string,
  body: { amount?: number; reason?: string }
) {
  const { amount, reason } = body

  if (amount === undefined) {
    return NextResponse.json(
      { error: 'amount is required for awarding XP' },
      { status: 400 }
    )
  }

  const xpAmount = parseInt(String(amount))
  if (isNaN(xpAmount) || xpAmount <= 0) {
    return NextResponse.json(
      { error: 'amount must be a positive integer' },
      { status: 400 }
    )
  }

  // Calculate coins: 1 coin per 5 XP awarded
  const coinsEarned = Math.floor(xpAmount / 5)

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const newXP = user.xp + xpAmount
  const newLevel = Math.floor(newXP / 500) + 1
  const newCoins = user.coins + coinsEarned
  const leveledUp = newLevel > user.level

  // Update best streak if current streak is higher
  const bestStreak = user.streak > user.bestStreak ? user.streak : user.bestStreak

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      xp: newXP,
      level: newLevel,
      coins: newCoins,
      bestStreak,
      lastActiveAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      xp: true,
      level: true,
      coins: true,
      streak: true,
      bestStreak: true,
    },
  })

  return NextResponse.json({
    user: updatedUser,
    xpAwarded: xpAmount,
    coinsAwarded: coinsEarned,
    leveledUp,
    newLevel,
  })
}

// ─── POST: Check Achievements ──────────────────────────────────────────

async function handleCheckAchievements(userId: string) {
  // Get all achievements
  const achievements = await db.achievement.findMany()

  // Get user's current achievements
  const userAchievements = await db.userAchievement.findMany({
    where: { userId },
  })

  // Get user stats for checking
  const deliveredOrders = await db.order.count({
    where: {
      recommenderId: userId,
      status: 'delivered',
    },
  })

  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const earnedIds = new Set(userAchievements.map((ua) => ua.achievementId))
  const newlyEarned: Array<{
    achievementId: string
    name: string
    xpReward: number
    coinReward: number
  }> = []

  for (const achievement of achievements) {
    const progress = calculateAchievementProgress(
      achievement.category,
      achievement.threshold,
      user,
      deliveredOrders
    )

    if (progress >= achievement.threshold && !earnedIds.has(achievement.id)) {
      // Award the achievement
      await db.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          progress: achievement.threshold,
          completed: true,
          completedAt: new Date(),
        },
      })

      // Award XP and coin rewards
      if (achievement.xpReward > 0 || achievement.coinReward > 0) {
        const currentUser = await db.user.findUnique({ where: { id: userId } })
        if (currentUser) {
          const newXP = currentUser.xp + achievement.xpReward
          const newLevel = Math.floor(newXP / 500) + 1
          const newCoins = currentUser.coins + achievement.coinReward
          await db.user.update({
            where: { id: userId },
            data: { xp: newXP, level: newLevel, coins: newCoins },
          })
        }
      }

      newlyEarned.push({
        achievementId: achievement.id,
        name: achievement.name,
        xpReward: achievement.xpReward,
        coinReward: achievement.coinReward,
      })
    } else {
      // Update progress
      await db.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        create: {
          userId,
          achievementId: achievement.id,
          progress,
          completed: progress >= achievement.threshold,
          completedAt: progress >= achievement.threshold ? new Date() : null,
        },
        update: {
          progress,
          ...(progress >= achievement.threshold && !earnedIds.has(achievement.id)
            ? { completed: true, completedAt: new Date() }
            : {}),
        },
      })
    }
  }

  // Also check badges
  const badges = await db.badge.findMany()
  const userBadges = await db.userBadge.findMany({
    where: { userId },
  })
  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId))
  const newlyEarnedBadges: Array<{
    badgeId: string
    name: string
    xpReward: number
    coinReward: number
  }> = []

  for (const badge of badges) {
    const progress = calculateAchievementProgress(
      badge.category,
      badge.threshold,
      user,
      deliveredOrders
    )

    if (progress >= badge.threshold && !earnedBadgeIds.has(badge.id)) {
      await db.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
        },
      })

      // Award XP and coin rewards for badges
      if (badge.xpReward > 0 || badge.coinReward > 0) {
        const currentUser = await db.user.findUnique({ where: { id: userId } })
        if (currentUser) {
          const newXP = currentUser.xp + badge.xpReward
          const newLevel = Math.floor(newXP / 500) + 1
          const newCoins = currentUser.coins + badge.coinReward
          await db.user.update({
            where: { id: userId },
            data: { xp: newXP, level: newLevel, coins: newCoins },
          })
        }
      }

      newlyEarnedBadges.push({
        badgeId: badge.id,
        name: badge.name,
        xpReward: badge.xpReward,
        coinReward: badge.coinReward,
      })
    }
  }

  return NextResponse.json({
    newlyEarnedAchievements: newlyEarned,
    newlyEarnedBadges,
  })
}

// ─── POST: Claim Quest ─────────────────────────────────────────────────

async function handleClaimQuest(
  userId: string,
  body: { questId?: string }
) {
  const { questId } = body

  if (!questId) {
    return NextResponse.json(
      { error: 'questId is required' },
      { status: 400 }
    )
  }

  // Find the user's quest entry
  const userQuest = await db.userDailyQuest.findFirst({
    where: {
      id: questId,
      userId,
    },
    include: {
      quest: true,
    },
  })

  if (!userQuest) {
    return NextResponse.json(
      { error: 'Quest not found for this user' },
      { status: 404 }
    )
  }

  if (!userQuest.completed) {
    return NextResponse.json(
      { error: 'Quest is not yet completed' },
      { status: 400 }
    )
  }

  if (userQuest.claimed) {
    return NextResponse.json(
      { error: 'Quest reward already claimed' },
      { status: 400 }
    )
  }

  // Check if quest has expired
  if (new Date() > userQuest.expiresAt) {
    return NextResponse.json(
      { error: 'Quest has expired' },
      { status: 400 }
    )
  }

  // Award XP and coins
  const currentUser = await db.user.findUnique({ where: { id: userId } })
  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const newXP = currentUser.xp + userQuest.quest.xpReward
  const newLevel = Math.floor(newXP / 500) + 1
  const newCoins = currentUser.coins + userQuest.quest.coinReward
  const leveledUp = newLevel > currentUser.level

  await db.user.update({
    where: { id: userId },
    data: { xp: newXP, level: newLevel, coins: newCoins },
  })

  // Mark quest as claimed
  await db.userDailyQuest.update({
    where: { id: questId },
    data: { claimed: true },
  })

  return NextResponse.json({
    quest: {
      id: userQuest.id,
      name: userQuest.quest.name,
      xpReward: userQuest.quest.xpReward,
      coinReward: userQuest.quest.coinReward,
    },
    xpAwarded: userQuest.quest.xpReward,
    coinsAwarded: userQuest.quest.coinReward,
    leveledUp,
    newLevel,
  })
}

// ─── POST: Spin ────────────────────────────────────────────────────────

async function handleSpin(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const now = new Date()

  // Check if we need to reset spins (new day)
  let spinsToday = user.spinsToday
  if (!isSameDay(user.lastSpinAt, now)) {
    spinsToday = 0
  }

  // Check spin limit
  if (spinsToday >= MAX_SPINS_PER_DAY) {
    return NextResponse.json(
      { error: `You have used all ${MAX_SPINS_PER_DAY} spins for today` },
      { status: 400 }
    )
  }

  // Perform weighted random selection
  const segmentIndex = SPIN_SEGMENTS.indexOf(weightedRandomSelect(SPIN_SEGMENTS))
  const segment = SPIN_SEGMENTS[segmentIndex]

  // Award XP and coins
  const newXP = user.xp + segment.xp
  const newLevel = Math.floor(newXP / 500) + 1
  const newCoins = user.coins + segment.coins
  const leveledUp = newLevel > user.level

  // Update user: increment spinsToday, set lastSpinAt
  await db.user.update({
    where: { id: userId },
    data: {
      xp: newXP,
      level: newLevel,
      coins: newCoins,
      spinsToday: spinsToday + 1,
      lastSpinAt: now,
    },
  })

  return NextResponse.json({
    xp: segment.xp,
    coins: segment.coins,
    label: segment.label,
    color: segment.color,
    segmentIndex,
    spinsRemaining: MAX_SPINS_PER_DAY - spinsToday - 1,
    leveledUp,
    newLevel,
  })
}

// ─── POST: Buy Reward ──────────────────────────────────────────────────

async function handleBuyReward(
  userId: string,
  body: { rewardId?: string }
) {
  const { rewardId } = body

  if (!rewardId) {
    return NextResponse.json(
      { error: 'rewardId is required' },
      { status: 400 }
    )
  }

  // Find the reward
  const reward = await db.reward.findUnique({
    where: { id: rewardId },
  })

  if (!reward) {
    return NextResponse.json(
      { error: 'Reward not found' },
      { status: 404 }
    )
  }

  if (!reward.active) {
    return NextResponse.json(
      { error: 'Reward is not available' },
      { status: 400 }
    )
  }

  // Check if user already owns this reward
  const existingReward = await db.userReward.findUnique({
    where: {
      userId_rewardId: {
        userId,
        rewardId,
      },
    },
  })

  if (existingReward) {
    return NextResponse.json(
      { error: 'You already own this reward' },
      { status: 400 }
    )
  }

  // Check if user has enough coins
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.coins < reward.coinCost) {
    return NextResponse.json(
      { error: `Not enough coins. You have ${user.coins} but need ${reward.coinCost}` },
      { status: 400 }
    )
  }

  // Deduct coins and create UserReward
  const newCoins = user.coins - reward.coinCost

  // If reward has xpBonus, award that too
  let newXP = user.xp
  let newLevel = user.level
  let leveledUp = false

  if (reward.xpBonus > 0) {
    newXP = user.xp + reward.xpBonus
    newLevel = Math.floor(newXP / 500) + 1
    leveledUp = newLevel > user.level
  }

  await db.user.update({
    where: { id: userId },
    data: {
      coins: newCoins,
      xp: newXP,
      level: newLevel,
    },
  })

  const userReward = await db.userReward.create({
    data: {
      userId,
      rewardId,
      active: true,
    },
    include: {
      reward: true,
    },
  })

  return NextResponse.json({
    purchase: {
      id: userReward.id,
      reward: {
        id: reward.id,
        name: reward.name,
        description: reward.description,
        icon: reward.icon,
        category: reward.category,
        coinCost: reward.coinCost,
        xpBonus: reward.xpBonus,
        rarity: reward.rarity,
      },
      purchasedAt: userReward.purchasedAt,
    },
    coinsSpent: reward.coinCost,
    coinsRemaining: newCoins,
    xpBonusAwarded: reward.xpBonus,
    leveledUp,
    newLevel,
  })
}
