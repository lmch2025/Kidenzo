import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, rating, comment } = body

    if (!orderId || !rating) {
      return NextResponse.json(
        { error: 'Données invalides. La commande et la note sont requises.' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'La note doit être comprise entre 1 et 5.' },
        { status: 400 }
      )
    }

    // Verify order exists
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { miniSite: { include: { product: true } } },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }

    // Check if review already exists
    const existingReview = await db.productReview.findUnique({
      where: { orderId },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Tu as déjà donné ton avis pour cette commande.' },
        { status: 400 }
      )
    }

    // Create the review
    const review = await db.productReview.create({
      data: {
        orderId: order.id,
        productId: order.miniSite.productId,
        customerName: order.customerName,
        rating,
        comment,
      },
    })

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'avis.' },
      { status: 500 }
    )
  }
}
