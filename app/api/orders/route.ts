// API Route to fetch orders from DIMS-SR database

import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreB } from '@/lib/firebase-b-admin'

/**
 * GET /api/orders
 * Fetch SIM orders from DIMS-SR database
 * Query params: search=value, limit=number, offset=number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch orders from DIMS-SR database

    // Get Firestore instance for DIMS-SR project
    const db = getFirestoreB()

    // Build query - get orders ordered by order date (newest first)
    let query = db.collection('orders')
      .orderBy('orderDate', 'desc')
      .limit(limit)

    // Execute query
    const snapshot = await query.get()

    // Convert to our data structure
    let orders: any[] = []
    snapshot.forEach(doc => {
      const data = doc.data()
      orders.push({
        id: doc.id,
        uid: data.uid || '',
        transactionId: data.transactionId || '',
        trackingNumber: data.trackingNumber || '',
        simId: data.simId || '',
        status: data.status || 'unknown',
        orderDate: data.orderDate ? new Date(data.orderDate._seconds * 1000).toISOString() : new Date().toISOString(),
        estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery._seconds * 1000).toISOString() : null,
        timeline: data.timeline || [],
        createdAt: data.createdAt ? new Date(data.createdAt._seconds * 1000).toISOString() : new Date().toISOString()
      })
    })

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      orders = orders.filter(order =>
        order.transactionId?.toLowerCase().includes(searchLower) ||
        order.trackingNumber?.toLowerCase().includes(searchLower) ||
        order.status?.toLowerCase().includes(searchLower) ||
        order.simId?.toLowerCase().includes(searchLower)
      )
    }

    // Apply offset
    if (offset > 0) {
      orders = orders.slice(offset)
    }

    const total = orders.length

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        total,
        limit,
        offset,
        hasNextPage: total === limit
      },
      note: "Data fetched from Firebase Project B - DIMS-SR (Orders)"
    })

  } catch (error) {
    console.error('[DIMS-SR API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}