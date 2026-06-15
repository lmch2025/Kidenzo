import { db } from '@/lib/db'

async function main() {
  console.log('🌱 Seeding database...\n')

  // ─── Badges ────────────────────────────────────────────────────────
  const badgesData = [
    // Sale badges
    { name: 'Première Vente', description: 'Complétez votre première vente', icon: 'Trophy', category: 'sale', rarity: 'common', threshold: 1, xpReward: 50, coinReward: 10 },
    { name: 'Vendeur Bronze', description: 'Complétez 5 ventes', icon: 'Medal', category: 'sale', rarity: 'common', threshold: 5, xpReward: 150, coinReward: 30 },
    { name: 'Vendeur Argent', description: 'Complétez 25 ventes', icon: 'Award', category: 'sale', rarity: 'rare', threshold: 25, xpReward: 500, coinReward: 100 },
    { name: 'Vendeur Or', description: 'Complétez 100 ventes', icon: 'Crown', category: 'sale', rarity: 'epic', threshold: 100, xpReward: 2000, coinReward: 500 },
    { name: 'Vendeur Diamant', description: 'Complétez 500 ventes', icon: 'Gem', category: 'sale', rarity: 'legendary', threshold: 500, xpReward: 5000, coinReward: 1500 },
    // Social badges
    { name: 'Super Réseau', description: 'Recrutez 10 recommandeurs', icon: 'Users', category: 'social', rarity: 'common', threshold: 10, xpReward: 300, coinReward: 50 },
    { name: 'Influenceur', description: 'Ayez 50 recommandeurs dans votre réseau', icon: 'Star', category: 'social', rarity: 'rare', threshold: 50, xpReward: 1000, coinReward: 200 },
    { name: 'Ambassadeur Global', description: 'Atteignez 100 recommandeurs', icon: 'Globe', category: 'social', rarity: 'epic', threshold: 100, xpReward: 3000, coinReward: 800 },
    // Streak badges
    { name: 'Série de 3', description: '3 jours consécutifs', icon: 'Flame', category: 'streak', rarity: 'common', threshold: 3, xpReward: 75, coinReward: 15 },
    { name: 'Série de 7', description: '7 jours consécutifs', icon: 'Flame', category: 'streak', rarity: 'rare', threshold: 7, xpReward: 200, coinReward: 50 },
    { name: 'Série de 30', description: '30 jours consécutifs', icon: 'Flame', category: 'streak', rarity: 'epic', threshold: 30, xpReward: 1000, coinReward: 300 },
    { name: 'Série de 100', description: '100 jours consécutifs - Légendaire!', icon: 'Flame', category: 'streak', rarity: 'legendary', threshold: 100, xpReward: 5000, coinReward: 1000 },
    // Milestone badges
    { name: 'Pionnier', description: 'L\'un des premiers utilisateurs', icon: 'Rocket', category: 'milestone', rarity: 'rare', threshold: 1, xpReward: 100, coinReward: 25 },
    { name: 'Centurion', description: 'Atteignez 100 XP', icon: 'Shield', category: 'milestone', rarity: 'common', threshold: 100, xpReward: 50, coinReward: 10 },
    { name: 'Millionnaire XP', description: 'Atteignez 10 000 XP', icon: 'Sparkles', category: 'milestone', rarity: 'legendary', threshold: 10000, xpReward: 0, coinReward: 2000 },
    // Special badges
    { name: 'Chanceux', description: 'Gagnez un prix rare à la roue', icon: 'Clover', category: 'special', rarity: 'rare', threshold: 1, xpReward: 200, coinReward: 100 },
    { name: 'Collectionneur', description: 'Obtenez 10 badges', icon: 'Bookmark', category: 'special', rarity: 'epic', threshold: 10, xpReward: 500, coinReward: 200 },
  ]

  let badgesCreated = 0
  for (const data of badgesData) {
    const existing = await db.badge.findFirst({ where: { name: data.name, category: data.category } })
    if (!existing) {
      await db.badge.create({ data })
      badgesCreated++
    }
  }
  console.log(`✅ Badges: ${badgesCreated} created (total: ${badgesData.length})`)

  // ─── Achievements ──────────────────────────────────────────────────
  const achievementsData = [
    { name: 'As des Ventes', description: 'Complétez 50 ventes', icon: 'Target', category: 'sale', threshold: 50, xpReward: 800, coinReward: 150 },
    { name: 'Maître Réseau', description: 'Recrutez 25 recommandeurs', icon: 'Network', category: 'social', threshold: 25, xpReward: 600, coinReward: 100 },
    { name: 'Légende Vivante', description: 'Atteignez le niveau 10', icon: 'Sparkles', category: 'milestone', threshold: 10, xpReward: 1500, coinReward: 500 },
    { name: 'Roi des Commissions', description: 'Gagnez 1 000 000 FCFA en commissions', icon: 'Gem', category: 'milestone', threshold: 1000000, xpReward: 2000, coinReward: 800 },
    { name: 'Momentum', description: 'Atteignez une série de 14 jours', icon: 'Zap', category: 'streak', threshold: 14, xpReward: 700, coinReward: 200 },
    { name: 'Vétéran', description: 'Atteignez le niveau 5', icon: 'Shield', category: 'milestone', threshold: 5, xpReward: 400, coinReward: 100 },
    { name: 'Étoile Montante', description: 'Complétez 10 ventes en une semaine', icon: 'TrendingUp', category: 'sale', threshold: 10, xpReward: 500, coinReward: 120 },
    { name: 'Pilier Communautaire', description: 'Aidez 5 recommandeurs à faire leur première vente', icon: 'Heart', category: 'social', threshold: 5, xpReward: 350, coinReward: 80 },
  ]

  let achievementsCreated = 0
  for (const data of achievementsData) {
    const existing = await db.achievement.findFirst({ where: { name: data.name, category: data.category } })
    if (!existing) {
      await db.achievement.create({ data })
      achievementsCreated++
    }
  }
  console.log(`✅ Achievements: ${achievementsCreated} created (total: ${achievementsData.length})`)

  // ─── Daily Quests ──────────────────────────────────────────────────
  const dailyQuestsData = [
    { name: 'Connexion Quotidienne', description: 'Connectez-vous aujourd\'hui', icon: 'LogIn', category: 'daily', type: 'daily', threshold: 1, xpReward: 25, coinReward: 5, active: true },
    { name: 'Première Vente du Jour', description: 'Faites votre première vente aujourd\'hui', icon: 'ShoppingBag', category: 'sale', type: 'daily', threshold: 1, xpReward: 50, coinReward: 10, active: true },
    { name: '3 Ventes Aujourd\'hui', description: 'Complétez 3 ventes aujourd\'hui', icon: 'Package', category: 'sale', type: 'daily', threshold: 3, xpReward: 100, coinReward: 25, active: true },
    { name: 'Partage Actif', description: 'Partagez un lien de produit', icon: 'Share2', category: 'social', type: 'daily', threshold: 1, xpReward: 30, coinReward: 8, active: true },
    { name: 'Visiteur Gold', description: 'Générez 10 visites sur vos liens', icon: 'Eye', category: 'social', type: 'daily', threshold: 10, xpReward: 75, coinReward: 15, active: true },
    // Weekly quests
    { name: 'Semaine de Ventes', description: 'Complétez 15 ventes cette semaine', icon: 'BarChart3', category: 'sale', type: 'weekly', threshold: 15, xpReward: 300, coinReward: 80, active: true },
    { name: 'Série Hebdomadaire', description: 'Connectez-vous 7 jours de suite', icon: 'Flame', category: 'streak', type: 'weekly', threshold: 7, xpReward: 200, coinReward: 50, active: true },
    { name: 'Réseau en Croissance', description: 'Recrutez 3 nouveaux recommandeurs cette semaine', icon: 'UserPlus', category: 'social', type: 'weekly', threshold: 3, xpReward: 250, coinReward: 60, active: true },
  ]

  let questsCreated = 0
  for (const data of dailyQuestsData) {
    const existing = await db.dailyQuest.findFirst({ where: { name: data.name, type: data.type } })
    if (!existing) {
      await db.dailyQuest.create({ data })
      questsCreated++
    }
  }
  console.log(`✅ Daily Quests: ${questsCreated} created (total: ${dailyQuestsData.length})`)

  // ─── Rewards (Shop) ────────────────────────────────────────────────
  const rewardsData = [
    { name: 'Boost XP x2', description: 'Doublez vos XP pendant 24h', icon: 'Zap', category: 'boost', coinCost: 100, xpBonus: 0, rarity: 'common', active: true },
    { name: 'Thème Sombre Premium', description: 'Débloquez un thème sombre exclusif', icon: 'Moon', category: 'cosmetic', coinCost: 200, xpBonus: 0, rarity: 'rare', active: true },
    { name: 'Badge Personnalisé', description: 'Créez votre propre badge unique', icon: 'Star', category: 'cosmetic', coinCost: 500, xpBonus: 0, rarity: 'epic', active: true },
    { name: 'Boost Commission +5%', description: 'Augmentez votre commission de 5% pendant 48h', icon: 'TrendingUp', category: 'boost', coinCost: 150, xpBonus: 0, rarity: 'rare', active: true },
    { name: 'Spin Gratuit', description: 'Obtenez un tour de roue gratuit', icon: 'RotateCw', category: 'special', coinCost: 50, xpBonus: 0, rarity: 'common', active: true },
    { name: 'Lot 500 XP', description: 'Recevez 500 XP instantanément', icon: 'Sparkles', category: 'boost', coinCost: 80, xpBonus: 500, rarity: 'common', active: true },
    { name: 'Lot 2000 XP', description: 'Recevez 2000 XP instantanément', icon: 'Sparkles', category: 'boost', coinCost: 300, xpBonus: 2000, rarity: 'rare', active: true },
    { name: 'Titre Légendaire', description: 'Débloquez un titre de profil légendaire', icon: 'Crown', category: 'cosmetic', coinCost: 1000, xpBonus: 0, rarity: 'legendary', active: true },
  ]

  let rewardsCreated = 0
  for (const data of rewardsData) {
    const existing = await db.reward.findFirst({ where: { name: data.name } })
    if (!existing) {
      await db.reward.create({ data })
      rewardsCreated++
    }
  }
  console.log(`✅ Rewards: ${rewardsCreated} created (total: ${rewardsData.length})`)

  // ─── Users ─────────────────────────────────────────────────────────
  const owner = await db.user.upsert({
    where: { phone: '237690000001' },
    update: {},
    create: {
      phone: '237690000001',
      pinHash: '1234',
      name: 'Marie Propriétaire',
      role: 'owner',
      xp: 1250,
      level: 3,
      coins: 250,
      streak: 5,
      bestStreak: 12,
    },
  })

  const ambassador = await db.user.upsert({
    where: { phone: '237690000002' },
    update: {},
    create: {
      phone: '237690000002',
      pinHash: '1234',
      name: 'Jean Ambassadeur',
      role: 'ambassador',
      xp: 3200,
      level: 7,
      coins: 750,
      streak: 14,
      bestStreak: 21,
    },
  })

  const recommender = await db.user.upsert({
    where: { phone: '237690000003' },
    update: {},
    create: {
      phone: '237690000003',
      pinHash: '1234',
      name: 'Paul Recommandeur',
      role: 'recommender',
      ambassadorId: ambassador.id,
      xp: 800,
      level: 2,
      coins: 120,
      streak: 3,
      bestStreak: 7,
    },
  })

  // Give some XP to demo users
  await db.user.update({ where: { id: owner.id }, data: { xp: 1250, level: 3, coins: 250, streak: 5, bestStreak: 12 } })
  await db.user.update({ where: { id: ambassador.id }, data: { xp: 3200, level: 7, coins: 750, streak: 14, bestStreak: 21 } })
  await db.user.update({ where: { id: recommender.id }, data: { xp: 800, level: 2, coins: 120, streak: 3, bestStreak: 7 } })

  console.log(`✅ Users: 3 demo users (owner, ambassador, recommender) with XP & coins`)

  // ─── Products + MiniSites ──────────────────────────────────────────
  const productsData = [
    {
      name: 'Huile de Palme Premium',
      description: 'Huile de palme premium de haute qualité, pressée à froid et 100% naturelle.',
      basePrice: 5000,
      category: 'alimentation',
      stock: 100,
      maxCommission: 30,
      slug: 'huile-de-palme-premium',
    },
    {
      name: 'Tissu Wax Hollandais',
      description: 'Tissu Wax Hollandais authentique, motifs vibrants et qualité supérieure.',
      basePrice: 12000,
      category: 'textile',
      stock: 50,
      maxCommission: 25,
      slug: 'tissu-wax-hollandais',
    },
    {
      name: 'Café Arabica du Cameroon',
      description: 'Café Arabica du Cameroun, torréfié artisanalement pour un arôme riche et unique.',
      basePrice: 3500,
      category: 'boisson',
      stock: 200,
      maxCommission: 35,
      slug: 'cafe-arabica-du-cameroon',
    },
  ]

  const miniSites: { id: string; slug: string }[] = []
  let productsCreated = 0
  let miniSitesCreated = 0

  for (const pData of productsData) {
    let product = await db.product.findFirst({ where: { name: pData.name, ownerId: owner.id } })

    if (!product) {
      product = await db.product.create({
        data: {
          name: pData.name,
          description: pData.description,
          basePrice: pData.basePrice,
          category: pData.category,
          stock: pData.stock,
          maxCommission: pData.maxCommission,
          ownerId: owner.id,
        },
      })
      productsCreated++
    }

    let miniSite = await db.miniSite.findUnique({ where: { slug: pData.slug } })

    if (!miniSite) {
      miniSite = await db.miniSite.create({
        data: {
          productId: product.id,
          slug: pData.slug,
        },
      })
      miniSitesCreated++
    }

    miniSites.push({ id: miniSite.id, slug: miniSite.slug })
  }

  console.log(`✅ Products: ${productsCreated} created (total: ${productsData.length})`)
  console.log(`✅ MiniSites: ${miniSitesCreated} created (total: ${productsData.length})`)

  // ─── RecommenderProducts ───────────────────────────────────────────
  const commissionPcts = [10, 15, 20]
  let recommenderProductsCreated = 0

  for (let i = 0; i < miniSites.length; i++) {
    const ms = miniSites[i]
    const existing = await db.recommenderProduct.findFirst({
      where: { recommenderId: recommender.id, miniSiteId: ms.id },
    })

    if (!existing) {
      await db.recommenderProduct.create({
        data: {
          recommenderId: recommender.id,
          miniSiteId: ms.id,
          commissionPct: commissionPcts[i],
        },
      })
      recommenderProductsCreated++
    }
  }

  console.log(`✅ RecommenderProducts: ${recommenderProductsCreated} created (total: ${miniSites.length})`)

  // ─── Orders ────────────────────────────────────────────────────────
  const ordersData = [
    {
      customerName: 'Alice Dupont',
      customerPhone: '237691110001',
      customerAddress: '123 Rue des Palmiers, Douala',
      customerMessage: 'Livraison rapide SVP',
      finalPrice: 5500,
      commissionRecommender: 500,
      commissionAmbassador: 250,
      status: 'pending',
    },
    {
      customerName: 'Bob Kamga',
      customerPhone: '237691110002',
      customerAddress: '45 Ave de la Réunification, Yaoundé',
      customerMessage: null,
      finalPrice: 13200,
      commissionRecommender: 1800,
      commissionAmbassador: 900,
      status: 'confirmed',
    },
    {
      customerName: 'Claire Ngassa',
      customerPhone: '237691110003',
      customerAddress: '78 Blvd de la Liberté, Bafoussam',
      customerMessage: 'Appeler avant livraison',
      finalPrice: 3850,
      commissionRecommender: 700,
      commissionAmbassador: 350,
      status: 'delivered',
    },
  ]

  let ordersCreated = 0

  for (let i = 0; i < ordersData.length; i++) {
    const oData = ordersData[i]
    const ms = miniSites[i]

    const existing = await db.order.findFirst({
      where: {
        customerPhone: oData.customerPhone,
        miniSiteId: ms.id,
        status: oData.status,
      },
    })

    if (!existing) {
      await db.order.create({
        data: {
          miniSiteId: ms.id,
          recommenderId: recommender.id,
          customerName: oData.customerName,
          customerPhone: oData.customerPhone,
          customerAddress: oData.customerAddress,
          customerMessage: oData.customerMessage,
          finalPrice: oData.finalPrice,
          commissionRecommender: oData.commissionRecommender,
          commissionAmbassador: oData.commissionAmbassador,
          status: oData.status,
        },
      })
      ordersCreated++
    }
  }

  console.log(`✅ Orders: ${ordersCreated} created (total: ${ordersData.length})`)

  // ─── Assign some daily quests to the recommender ───────────────────
  const allDailyQuests = await db.dailyQuest.findMany({ where: { type: 'daily' } })
  let questsAssigned = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  for (const quest of allDailyQuests) {
    const existing = await db.userDailyQuest.findFirst({
      where: {
        userId: recommender.id,
        questId: quest.id,
        assignedAt: { gte: today },
      },
    })

    if (!existing) {
      await db.userDailyQuest.create({
        data: {
          userId: recommender.id,
          questId: quest.id,
          progress: quest.threshold === 1 ? 1 : Math.floor(Math.random() * quest.threshold),
          completed: quest.threshold === 1,
          claimed: quest.threshold === 1 && Math.random() > 0.5,
          assignedAt: today,
          expiresAt: tomorrow,
        },
      })
      questsAssigned++
    }
  }

  console.log(`✅ User Daily Quests: ${questsAssigned} assigned to recommender`)

  // ─── SystemConfig ───────────────────────────────────────────────────
  await db.systemConfig.upsert({
    where: { key: 'min_withdrawal_amount' },
    update: {},
    create: {
      key: 'min_withdrawal_amount',
      value: '2000',
    },
  })
  console.log(`✅ SystemConfig: min_withdrawal_amount set to 2000`)

  // ─── Summary ───────────────────────────────────────────────────────
  const badgeCount = await db.badge.count()
  const achievementCount = await db.achievement.count()
  const questCount = await db.dailyQuest.count()
  const rewardCount = await db.reward.count()
  const userCount = await db.user.count()
  const productCount = await db.product.count()
  const miniSiteCount = await db.miniSite.count()
  const recommenderProductCount = await db.recommenderProduct.count()
  const orderCount = await db.order.count()

  console.log('\n📊 Database totals:')
  console.log(`   Badges:              ${badgeCount}`)
  console.log(`   Achievements:        ${achievementCount}`)
  console.log(`   Daily Quests:        ${questCount}`)
  console.log(`   Rewards:             ${rewardCount}`)
  console.log(`   Users:               ${userCount}`)
  console.log(`   Products:            ${productCount}`)
  console.log(`   MiniSites:           ${miniSiteCount}`)
  console.log(`   RecommenderProducts: ${recommenderProductCount}`)
  console.log(`   Orders:              ${orderCount}`)

  console.log('\n🌱 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
