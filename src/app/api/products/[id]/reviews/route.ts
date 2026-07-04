import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const reviews = await db.productReview.findMany({
      where: {
        productId: id,
        status: 'published',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        customerName: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    })

    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
      : 0

    return NextResponse.json({
      reviews,
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
    })
  } catch (error: any) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews', details: error?.message || String(error) }, { status: 500 })
  }
}
