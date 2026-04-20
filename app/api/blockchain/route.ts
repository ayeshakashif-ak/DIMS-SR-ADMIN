// API Route to fetch SIM registrations from DIMS-SR database
// Connects to Firebase Project B (DIMS-SR) using Admin SDK

import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreB } from '@/lib/firebase-b-admin'

/**
 * GET /api/blockchain
 * Fetch SIM registrations from DIMS-SR database
 * Query params: search=value, limit=number, offset=number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get Firestore instance for DIMS-SR project
    const db = getFirestoreB()

    // Build query - get SIM registrations ordered by creation date (newest first)
    let query = db.collection('sims')
      .orderBy('createdAt', 'desc')
      .limit(limit)

    // Execute query
    const snapshot = await query.get()

    // Convert to our data structure
    let sims: any[] = []
    snapshot.forEach(doc => {
      const data = doc.data()
      sims.push({
        id: doc.id,
        uid: data.uid || '',
        cnic: data.cnic || '',
        transactionId: data.transactionId || '',
        trackingNumber: data.trackingNumber || '',
        networkProvider: data.networkProvider || '',
        mobileNumber: data.mobileNumber || '',
        deliveryAddress: data.deliveryAddress || '',
        paymentAddress: data.paymentAddress || '',
        fingerprintVerificationStatus: data.fingerprintVerificationStatus || 'unknown',
        status: data.status || 'unknown',
        registrationDate: data.registrationDate ? new Date(data.registrationDate._seconds * 1000).toISOString() : null,
        activationDate: data.activationDate ? new Date(data.activationDate._seconds * 1000).toISOString() : null,
        deactivationDate: data.deactivationDate ? new Date(data.deactivationDate._seconds * 1000).toISOString() : null,
        createdAt: data.createdAt ? new Date(data.createdAt._seconds * 1000).toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt._seconds * 1000).toISOString() : null
      })
    })

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      sims = sims.filter(sim =>
        sim.cnic?.toLowerCase().includes(searchLower) ||
        sim.mobileNumber?.toLowerCase().includes(searchLower) ||
        sim.networkProvider?.toLowerCase().includes(searchLower) ||
        sim.status?.toLowerCase().includes(searchLower) ||
        sim.transactionId?.toLowerCase().includes(searchLower) ||
        sim.trackingNumber?.toLowerCase().includes(searchLower)
      )
    }

    // Apply offset (simple implementation - in production you'd use cursor-based pagination)
    if (offset > 0) {
      sims = sims.slice(offset)
    }

    const total = sims.length

    return NextResponse.json({
      success: true,
      data: sims,
      pagination: {
        total,
        limit,
        offset,
        hasNextPage: total === limit
      },
      note: "Data fetched from Firebase Project B - DIMS-SR (SIM Registrations)"
    })

  } catch (error) {
    console.error('[DIMS-SR API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch SIM registrations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
