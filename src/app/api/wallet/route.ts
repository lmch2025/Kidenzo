import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Find or create wallet
    let wallet = await db.customerWallet.findUnique({
      where: { userId },
      include: {
        installmentPlans: {
          include: { payments: true },
          orderBy: { createdAt: 'desc' }
        },
        savingsGoals: {
          include: { deposits: true },
          orderBy: { createdAt: 'desc' }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })

    if (!wallet) {
      wallet = await db.customerWallet.create({
        data: { userId },
        include: {
          installmentPlans: {
            include: { payments: true }
          },
          savingsGoals: {
            include: { deposits: true }
          },
          transactions: true
        }
      })
    }

    return NextResponse.json(wallet)
  } catch (error) {
    console.error('Wallet GET error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, amount, paymentMethod, reference } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 })
    }

    let wallet = await db.customerWallet.findUnique({ where: { userId } })
    if (!wallet && action === 'create') {
      wallet = await db.customerWallet.create({ data: { userId } })
      return NextResponse.json(wallet, { status: 201 })
    }

    if (!wallet) {
      return NextResponse.json({ error: 'Portefeuille introuvable' }, { status: 404 })
    }

    if (action === 'deposit') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
      }

      const balanceBefore = wallet.balance
      const balanceAfter = balanceBefore + amount

      // Update wallet balance and create transaction
      wallet = await db.customerWallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          totalSaved: wallet.totalSaved + amount,
          transactions: {
            create: {
              type: 'deposit',
              amount,
              description: 'Dépôt sur le porte-monnaie',
              reference: reference || null,
              balanceBefore,
              balanceAfter
            }
          }
        }
      })
      
      return NextResponse.json(wallet)
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })

  } catch (error) {
    console.error('Wallet POST error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
