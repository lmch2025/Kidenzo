import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendPushNotification, PushPayload } from '@/lib/webpush'

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

export async function GET(request: NextRequest) {
  try {
    // Security: verify cron secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const now = new Date()
    const results = {
      installmentReminders: 0,
      savingsReminders: 0,
      expiredSubscriptions: 0,
      errors: 0,
    }

    // ─── 1. Installment Plan Reminders ────────────────────────────
    const duePlans = await db.installmentPlan.findMany({
      where: {
        status: 'active',
        nextDueDate: {
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Due today or overdue
        },
      },
      include: {
        wallet: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    for (const plan of duePlans) {
      // Check if a payment was already made today
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const paymentToday = await db.installmentPayment.findFirst({
        where: {
          planId: plan.id,
          paidAt: { gte: startOfToday }
        }
      })

      // Skip reminder if already paid today
      if (paymentToday) continue

      const userId = plan.wallet.userId
      const subscriptions = await db.pushSubscription.findMany({
        where: { userId },
      })

      if (subscriptions.length === 0) continue

      const isOverdue = plan.nextDueDate && plan.nextDueDate < now
      const payload: PushPayload = isOverdue
        ? {
            title: '⏰ Échéance dépassée',
            body: `Ton versement de ${formatPrice(plan.installmentAmount)} pour "${plan.productName}" est en retard. Reste ${formatPrice(plan.remainingAmount)} à payer.`,
            icon: '/icon-192x192.png',
            url: '/',
            tag: `installment-${plan.id}`,
          }
        : {
            title: '💰 Versement du jour',
            body: `C'est le moment de payer ${formatPrice(plan.installmentAmount)} pour "${plan.productName}". Tu es à ${Math.round((plan.paidInstallments / plan.totalInstallments) * 100)}% !`,
            icon: '/icon-192x192.png',
            url: '/',
            tag: `installment-${plan.id}`,
          }

      for (const sub of subscriptions) {
        const success = await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload
        )

        if (success) {
          results.installmentReminders++
        } else {
          // Remove expired subscription
          try {
            await db.pushSubscription.delete({ where: { id: sub.id } })
            results.expiredSubscriptions++
          } catch {
            results.errors++
          }
        }
      }
    }

    // ─── 2. Savings Goal Encouragement ───────────────────────────
    const activeGoals = await db.savingsGoal.findMany({
      where: {
        status: 'active',
        dailyTarget: { gt: 0 },
      },
      include: {
        wallet: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    for (const goal of activeGoals) {
      const userId = goal.wallet.userId
      const subscriptions = await db.pushSubscription.findMany({
        where: { userId },
      })

      if (subscriptions.length === 0) continue

      const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100)
      const remaining = goal.targetAmount - goal.currentAmount

      const payload: PushPayload = {
        title: '🐷 Ton épargne t\'attend',
        body: `Mets ${formatPrice(goal.dailyTarget || 0)} de côté pour "${goal.productName}". Déjà ${progress}% atteint ! Reste ${formatPrice(remaining)}.`,
        icon: '/icon-192x192.png',
        url: '/',
        tag: `savings-${goal.id}`,
      }

      for (const sub of subscriptions) {
        const success = await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload
        )

        if (success) {
          results.savingsReminders++
        } else {
          try {
            await db.pushSubscription.delete({ where: { id: sub.id } })
            results.expiredSubscriptions++
          } catch {
            results.errors++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
      summary: `Envoyé ${results.installmentReminders} rappels de crédit et ${results.savingsReminders} rappels d'épargne. ${results.expiredSubscriptions} abonnements expirés nettoyés.`,
    })
  } catch (error) {
    console.error('Cron wallet error:', error)
    return NextResponse.json({ error: 'Erreur interne du cron' }, { status: 500 })
  }
}
