import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      miniSiteId,
      customerName,
      customerPhone,
      customerAddress,
      customerMessage,
      finalPrice,
      downPaymentPct,
      frequency,
      durationDays,
      recommenderId,
      customProductName
    } = body

    if (!userId || (!miniSiteId && !customProductName) || !customerName || !customerPhone || !customerAddress || !finalPrice || !downPaymentPct || !frequency || !durationDays) {
      return NextResponse.json(
        { error: 'Données manquantes pour le plan de crédit' },
        { status: 400 }
      )
    }

    // ─── Wallet Configuration Validation ─────────────────────────────
    const walletConfigs = await db.systemConfig.findMany({
      where: {
        key: {
          in: [
            'wallet_credit_enabled',
            'wallet_min_down_payment_pct',
            'wallet_max_down_payment_pct',
            'wallet_min_installment_days',
            'wallet_max_installment_days',
            'wallet_max_active_plans',
          ],
        },
      },
    })

    const configMap: Record<string, string> = {}
    walletConfigs.forEach(c => { configMap[c.key] = c.value })

    if (configMap['wallet_credit_enabled'] === 'false') {
      return NextResponse.json({ error: 'Le paiement à tempérament est actuellement désactivé.' }, { status: 403 })
    }

    const minPct = parseFloat(configMap['wallet_min_down_payment_pct'] || '20')
    const maxPct = parseFloat(configMap['wallet_max_down_payment_pct'] || '80')
    const minDays = parseInt(configMap['wallet_min_installment_days'] || '7', 10)
    const maxDays = parseInt(configMap['wallet_max_installment_days'] || '180', 10)
    const maxActivePlans = parseInt(configMap['wallet_max_active_plans'] || '5', 10)

    if (downPaymentPct < minPct || downPaymentPct > maxPct) {
      return NextResponse.json({ error: `L'acompte doit être compris entre ${minPct}% et ${maxPct}%.` }, { status: 400 })
    }

    if (durationDays < minDays || durationDays > maxDays) {
      return NextResponse.json({ error: `La durée du crédit doit être comprise entre ${minDays} et ${maxDays} jours.` }, { status: 400 })
    }

    // Check max active plans
    let wallet = await db.customerWallet.findUnique({ where: { userId } })
    if (wallet) {
      const activePlansCount = await db.installmentPlan.count({
        where: { walletId: wallet.id, status: 'active' }
      })
      if (activePlansCount >= maxActivePlans) {
        return NextResponse.json({ error: `Vous avez atteint le nombre maximum de crédits actifs (${maxActivePlans}).` }, { status: 403 })
      }
    } else {
      wallet = await db.customerWallet.create({ data: { userId } })
    }
    // ─────────────────────────────────────────────────────────────────

    // Verify mini-site if provided
    let miniSite: any = null
    let productName = customProductName || "Produit personnalisé"
    let productImage = null

    if (miniSiteId) {
      miniSite = await db.miniSite.findUnique({
        where: { id: miniSiteId },
        include: { product: true }
      })

      if (!miniSite) {
        return NextResponse.json({ error: 'Mini-site introuvable' }, { status: 404 })
      }
      productName = miniSite.product.name
      const images = miniSite.product.images as any
      if (images && images.length > 0) {
        productImage = images[0].storageUrl
      }
    }



    // Calculate commissions (similar to order logic)
    let commissionRecommender = 0
    let commissionAmbassador = 0

    if (recommenderId && miniSiteId) {
      const recommenderProduct = await db.recommenderProduct.findUnique({
        where: { recommenderId_miniSiteId: { recommenderId, miniSiteId } }
      })
      if (recommenderProduct) {
        commissionRecommender = finalPrice * recommenderProduct.commissionPct / 100
      }
      const recommender = await db.user.findUnique({ where: { id: recommenderId } })
      if (recommender?.ambassadorId) {
        commissionAmbassador = finalPrice * 0.05
      }
    }

    // Create order
    const orderData: any = {
      customerName,
      customerPhone,
      customerAddress,
      customerMessage,
      finalPrice: parseFloat(String(finalPrice)),
      commissionRecommender,
      commissionAmbassador,
      status: 'pending'
    }

    if (miniSiteId) {
      orderData.miniSiteId = miniSiteId
    }

    if (recommenderId) {
      orderData.recommenderId = recommenderId
    }

    const order = await db.order.create({
      data: orderData
    })

    // Calculate installment details
    const downPayment = (finalPrice * downPaymentPct) / 100
    const remainingAmount = finalPrice - downPayment
    
    let totalInstallments = 1
    let nextDueDate = new Date()
    
    if (frequency === 'daily') {
      totalInstallments = durationDays
      nextDueDate.setDate(nextDueDate.getDate() + 1)
    } else if (frequency === 'weekly') {
      totalInstallments = Math.max(1, Math.floor(durationDays / 7))
      nextDueDate.setDate(nextDueDate.getDate() + 7)
    } else if (frequency === 'biweekly') {
      totalInstallments = Math.max(1, Math.floor(durationDays / 14))
      nextDueDate.setDate(nextDueDate.getDate() + 14)
    }

    const installmentAmount = remainingAmount / totalInstallments

    // Create installment plan
    const plan = await db.installmentPlan.create({
      data: {
        walletId: wallet.id,
        orderId: order.id,
        productName,
        productImage,
        totalAmount: finalPrice,
        downPayment,
        remainingAmount,
        installmentAmount,
        frequency,
        totalInstallments,
        paidInstallments: 0,
        nextDueDate,
        status: remainingAmount <= 0 ? 'completed' : 'active',
        completedAt: remainingAmount <= 0 ? new Date() : null,
      }
    })

    // Create down payment
    if (downPayment > 0) {
      await db.installmentPayment.create({
        data: {
          planId: plan.id,
          amount: downPayment,
          paymentMethod: 'mobile_money',
          status: 'confirmed'
        }
      })

      // Create transaction for down payment
      await db.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'installment_payment',
          amount: downPayment,
          description: `Acompte pour ${miniSite.product.name}`,
          reference: plan.id,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance
        }
      })
    }

    return NextResponse.json({ plan, order }, { status: 201 })
  } catch (error) {
    console.error('Installment POST error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, amount, paymentMethod = 'mobile_money', reference } = body

    if (!planId || !amount) {
      return NextResponse.json({ error: 'planId and amount are required' }, { status: 400 })
    }

    const plan = await db.installmentPlan.findUnique({
      where: { id: planId },
      include: { wallet: true }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan introuvable' }, { status: 404 })
    }

    if (plan.status !== 'active') {
      return NextResponse.json({ error: 'Ce plan n\'est pas actif' }, { status: 400 })
    }

    // Record payment
    await db.installmentPayment.create({
      data: {
        planId,
        amount,
        paymentMethod,
        reference,
        status: 'confirmed'
      }
    })

    // Update plan
    const paidInstallments = plan.paidInstallments + 1
    const remainingAmount = Math.max(0, plan.remainingAmount - amount)
    const isCompleted = remainingAmount <= 0
    
    let nextDueDate = plan.nextDueDate
    if (nextDueDate && !isCompleted) {
      nextDueDate = new Date(nextDueDate)
      if (plan.frequency === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1)
      else if (plan.frequency === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7)
      else if (plan.frequency === 'biweekly') nextDueDate.setDate(nextDueDate.getDate() + 14)
    }

    const updatedPlan = await db.installmentPlan.update({
      where: { id: planId },
      data: {
        paidInstallments,
        remainingAmount,
        nextDueDate: isCompleted ? null : nextDueDate,
        status: isCompleted ? 'completed' : 'active',
        completedAt: isCompleted ? new Date() : null
      }
    })

    // Transaction
    await db.walletTransaction.create({
      data: {
        walletId: plan.walletId,
        type: 'installment_payment',
        amount,
        description: `Versement pour ${plan.productName}`,
        reference: planId,
        balanceBefore: plan.wallet.balance,
        balanceAfter: plan.wallet.balance
      }
    })

    // If completed, we should ideally trigger order fulfillment logic
    if (isCompleted) {
      await db.order.update({
        where: { id: plan.orderId },
        data: { status: 'confirmed' }
      })
    }

    return NextResponse.json(updatedPlan)
  } catch (error) {
    console.error('Installment PUT error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
