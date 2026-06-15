import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/withdrawals - Get all withdrawals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // optional filter

    const where = status ? { status } : {}

    const withdrawals = await db.withdrawalRequest.findMany({
      where,
      include: {
        user: {
          select: { name: true, phone: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ withdrawals })
  } catch (error) {
    console.error('Admin Withdrawals GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/withdrawals - Update withdrawal status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, adminNotes } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      )
    }

    if (!['pending', 'approved', 'rejected', 'paid'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updated = await db.withdrawalRequest.update({
      where: { id },
      data: {
        status,
        ...(adminNotes && { adminNotes })
      }
    })

    return NextResponse.json({ success: true, withdrawal: updated })
  } catch (error) {
    console.error('Admin Withdrawals PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
