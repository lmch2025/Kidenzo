import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productId, targetDate, customProductName, customProductPrice } = body

    if (!userId || (!productId && (!customProductName || !customProductPrice))) {
      return NextResponse.json(
        { error: 'userId et productId (ou infos de produit personnalisé) sont requis' },
        { status: 400 }
      )
    }

    let productName = customProductName || "Produit personnalisé"
    let targetAmount = parseFloat(customProductPrice) || 0
    let productImage: string | null = null

    if (productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
        include: { images: true }
      })

      if (!product) {
        return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
      }
      productName = product.name
      targetAmount = product.basePrice
      productImage = product.images?.[0]?.storageUrl || null
    }

    // Ensure wallet exists
    let wallet = await db.customerWallet.findUnique({ where: { userId } })
    if (!wallet) {
      wallet = await db.customerWallet.create({ data: { userId } })
    }

    // Calculate daily target based on target date
    let dailyTarget: number | null = null
    
    if (targetDate) {
      const days = Math.max(1, Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      dailyTarget = targetAmount / days
    } else {
      // Default to 60 days if no date specified
      dailyTarget = targetAmount / 60
    }

    const goal = await db.savingsGoal.create({
      data: {
        walletId: wallet.id,
        productId: productId || null,
        productName: productName,
        productImage: productImage,
        targetAmount,
        currentAmount: 0,
        dailyTarget,
        targetDate: targetDate ? new Date(targetDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      }
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('Savings POST error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { goalId, amount, paymentMethod = 'mobile_money', reference } = body

    if (!goalId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'goalId and valid amount are required' }, { status: 400 })
    }

    const goal = await db.savingsGoal.findUnique({
      where: { id: goalId },
      include: { wallet: true }
    })

    if (!goal) {
      return NextResponse.json({ error: 'Objectif introuvable' }, { status: 404 })
    }

    if (goal.status !== 'active') {
      return NextResponse.json({ error: 'Cet objectif n\'est plus actif' }, { status: 400 })
    }

    // Record deposit
    await db.savingsDeposit.create({
      data: {
        goalId,
        amount,
        paymentMethod,
        reference,
        status: 'confirmed'
      }
    })

    // Update goal
    const currentAmount = goal.currentAmount + amount
    const isCompleted = currentAmount >= goal.targetAmount

    const updatedGoal = await db.savingsGoal.update({
      where: { id: goalId },
      data: {
        currentAmount,
        status: isCompleted ? 'completed' : 'active',
        completedAt: isCompleted ? new Date() : null
      }
    })

    // Transaction
    await db.walletTransaction.create({
      data: {
        walletId: goal.walletId,
        type: 'savings_deposit',
        amount,
        description: `Épargne pour ${goal.productName}`,
        reference: goalId,
        balanceBefore: goal.wallet.balance,
        balanceAfter: goal.wallet.balance
      }
    })

    await db.customerWallet.update({
      where: { id: goal.walletId },
      data: { totalSaved: { increment: amount } }
    })

    return NextResponse.json(updatedGoal)
  } catch (error) {
    console.error('Savings PUT error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { goalId } = body

    if (!goalId) {
      return NextResponse.json({ error: 'goalId is required' }, { status: 400 })
    }

    const goal = await db.savingsGoal.findUnique({
      where: { id: goalId },
      include: { wallet: true }
    })

    if (!goal) {
      return NextResponse.json({ error: 'Objectif introuvable' }, { status: 404 })
    }

    if (goal.status !== 'active') {
      return NextResponse.json({ error: 'Cet objectif n\'est pas actif' }, { status: 400 })
    }

    const updatedGoal = await db.savingsGoal.update({
      where: { id: goalId },
      data: {
        status: 'cancelled'
      }
    })

    // Refund current amount to wallet balance
    if (goal.currentAmount > 0) {
      await db.customerWallet.update({
        where: { id: goal.walletId },
        data: {
          balance: { increment: goal.currentAmount }
        }
      })

      await db.walletTransaction.create({
        data: {
          walletId: goal.walletId,
          type: 'deposit',
          amount: goal.currentAmount,
          description: `Remboursement suite annulation d'épargne: ${goal.productName}`,
          reference: goalId,
          balanceBefore: goal.wallet.balance,
          balanceAfter: goal.wallet.balance + goal.currentAmount
        }
      })
    }

    return NextResponse.json({ goal: updatedGoal, refundedAmount: goal.currentAmount })
  } catch (error) {
    console.error('Savings DELETE error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
