import { NextResponse } from 'next/server';
import { coolpayService } from '@/services/coolpay';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // 1. Vérification de la signature
    const isValid = coolpayService.verifySignature(payload);
    if (!isValid) {
      console.error("Signature CoolPay invalide", payload);
      return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 400 });
    }

    const {
      app_transaction_ref,
      transaction_status,
      transaction_amount
    } = payload;

    // Si la transaction n'est pas un succès, on log et on retourne OK pour éviter les retry inutiles
    if (transaction_status !== 'SUCCESS') {
      console.log(`Transaction ${app_transaction_ref} non réussie: ${transaction_status}`);
      return NextResponse.json({ status: 'OK' });
    }

    // Le format attendu pour app_transaction_ref est "TYPE:ID" (ex: "INSTALLMENT:cls123...")
    const [type, id] = app_transaction_ref.split(':');

    switch (type) {
      case 'INSTALLMENT':
        // Remboursement de dette / paiement échelonné
        await handleInstallmentPayment(id, transaction_amount);
        break;
      
      case 'SAVINGS':
        // Constitution d'épargne
        await handleSavingsDeposit(id, transaction_amount);
        break;

      case 'DELIVERY':
        // Paiement des frais de livraison pour une commande déjà réglée
        await handleDeliveryFeePayment(id, transaction_amount);
        break;

      case 'PAYOUT':
        // Notification d'un paiement de commission réussi
        await handleCommissionPayout(id);
        break;

      default:
        console.warn(`Type de transaction non géré: ${type} pour ${app_transaction_ref}`);
    }

    // 2. Retourner "OK" pour acquitter la réception
    return NextResponse.json({ status: 'OK' });

  } catch (error) {
    console.error("Erreur Webhook CoolPay:", error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}

async function handleInstallmentPayment(planId: string, amount: number) {
  const plan = await db.installmentPlan.findUnique({
    where: { id: planId }
  });

  if (!plan) return;

  // Création du paiement
  await db.installmentPayment.create({
    data: {
      planId: plan.id,
      amount: amount,
      paymentMethod: "my_coolpay",
      status: "confirmed"
    }
  });

  // Mise à jour du plan
  const newPaidInstallments = plan.paidInstallments + 1;
  const newRemaining = plan.remainingAmount - amount;
  
  await db.installmentPlan.update({
    where: { id: plan.id },
    data: {
      paidInstallments: newPaidInstallments,
      remainingAmount: newRemaining > 0 ? newRemaining : 0,
      status: newRemaining <= 0 ? "completed" : "active",
      completedAt: newRemaining <= 0 ? new Date() : null
    }
  });
}

async function handleSavingsDeposit(goalId: string, amount: number) {
  const goal = await db.savingsGoal.findUnique({
    where: { id: goalId }
  });

  if (!goal) return;

  await db.savingsDeposit.create({
    data: {
      goalId: goal.id,
      amount: amount,
      paymentMethod: "my_coolpay",
      status: "confirmed"
    }
  });

  const newAmount = goal.currentAmount + amount;

  await db.savingsGoal.update({
    where: { id: goal.id },
    data: {
      currentAmount: newAmount,
      status: newAmount >= goal.targetAmount ? "completed" : "active",
      completedAt: newAmount >= goal.targetAmount ? new Date() : null
    }
  });
}

async function handleDeliveryFeePayment(orderId: string, amount: number) {
  await db.order.update({
    where: { id: orderId },
    data: {
      deliveryFeePaid: true,
      deliveryFee: amount // On peut stocker le montant payé pour la livraison
    }
  });
}

async function handleCommissionPayout(withdrawalId: string) {
  await db.withdrawalRequest.update({
    where: { id: withdrawalId },
    data: {
      status: "paid",
      updatedAt: new Date()
    }
  });
}
