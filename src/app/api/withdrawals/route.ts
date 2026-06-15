import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/withdrawals - Get withdrawal history and current balance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // 1. Get user data for click earnings
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { clickEarnings: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Sum commission payments
    const commissions = await db.commissionPayment.aggregate({
      where: { beneficiaryId: userId },
      _sum: { amount: true }
    })
    const totalCommissions = commissions._sum.amount || 0

    // 3. Sum total withdrawals (pending, approved, paid)
    // Rejected requests are returned to the balance
    const withdrawals = await db.withdrawalRequest.aggregate({
      where: {
        userId,
        status: { in: ['pending', 'approved', 'paid'] }
      },
      _sum: { amount: true }
    })
    const totalWithdrawn = withdrawals._sum.amount || 0

    // 4. Calculate balance
    const balance = (user.clickEarnings + totalCommissions) - totalWithdrawn

    // 5. Get withdrawal history
    const history = await db.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    // 6. Get minimum withdrawal amount
    const config = await db.systemConfig.findUnique({
      where: { key: 'min_withdrawal_amount' }
    })
    const minWithdrawal = config ? parseFloat(config.value) : 2000

    return NextResponse.json({ balance, history, minWithdrawal })
  } catch (error) {
    console.error('Withdrawals GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/withdrawals - Request a withdrawal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, phoneNumber, paymentMethod = 'mobile_money' } = body

    if (!userId || !amount || !phoneNumber) {
      return NextResponse.json(
        { error: 'userId, amount, and phoneNumber are required' },
        { status: 400 }
      )
    }

    const withdrawalAmount = parseFloat(String(amount))
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Get minimum withdrawal amount from config
    const config = await db.systemConfig.findUnique({
      where: { key: 'min_withdrawal_amount' }
    })
    const minAmount = config ? parseFloat(config.value) : 2000

    if (withdrawalAmount < minAmount) {
      return NextResponse.json(
        { error: `Le montant minimum de retrait est de ${minAmount} FCFA.` },
        { status: 400 }
      )
    }

    // Recalculate balance to ensure sufficient funds
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const commissions = await db.commissionPayment.aggregate({
      where: { beneficiaryId: userId },
      _sum: { amount: true }
    })
    const totalCommissions = commissions._sum.amount || 0

    const withdrawals = await db.withdrawalRequest.aggregate({
      where: {
        userId,
        status: { in: ['pending', 'approved', 'paid'] }
      },
      _sum: { amount: true }
    })
    const totalWithdrawn = withdrawals._sum.amount || 0

    const balance = (user.clickEarnings + totalCommissions) - totalWithdrawn

    if (withdrawalAmount > balance) {
      return NextResponse.json(
        { error: 'Solde insuffisant.' },
        { status: 400 }
      )
    }

    // Create withdrawal request
    const requestRecord = await db.withdrawalRequest.create({
      data: {
        userId,
        amount: withdrawalAmount,
        phoneNumber,
        paymentMethod,
        status: 'pending'
      }
    })

    return NextResponse.json({ success: true, request: requestRecord, newBalance: balance - withdrawalAmount })
  } catch (error) {
    console.error('Withdrawals POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
