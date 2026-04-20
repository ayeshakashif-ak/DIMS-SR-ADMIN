// API Route to fetch SIM registrations from Firebase Project B (DIMS-SR)
// This uses the Firebase Admin SDK and is server-side only

import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreB } from '@/lib/firebase-b-admin'
import { SimRegistration } from '@/lib/types'

const PAGE_SIZE = 20
const COLLECTION_NAME = 'sims' // Correct collection name from DIMS-SR schema

/**
 * GET /api/sim
 * Fetch paginated SIM registrations with optional search/filter
 * Query params: page=0, search=value, status=value
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const firestore = getFirestoreB()
    let query = firestore.collection(COLLECTION_NAME)

    // Apply status filter if provided
    if (status) {
      query = query.where('status', '==', status)
    }

    // Get total count for pagination first
    const totalSnapshot = await query.get()
    const total = totalSnapshot.size

    // If no documents, return empty result
    if (total === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page: 0,
          pageSize: PAGE_SIZE,
          hasNextPage: false,
          total: 0,
        },
      })
    }

    // Apply pagination and ordering
    const offset = page * PAGE_SIZE

    // Try to order by registrationDate, createdAt, or fall back to document ID
    try {
      query = query.orderBy('registrationDate', 'desc')
    } catch (error) {
      try {
        // If registrationDate doesn't exist, try createdAt
        query = firestore.collection(COLLECTION_NAME)
        if (status) {
          query = query.where('status', '==', status)
        }
        query = query.orderBy('createdAt', 'desc')
      } catch (error2) {
        // If neither field exists, order by document ID
        console.warn('[SIM API] Could not order by registrationDate or createdAt, using document ID')
        query = firestore.collection(COLLECTION_NAME)
        if (status) {
          query = query.where('status', '==', status)
        }
        query = query.orderBy('__name__', 'desc')
      }
    }

    query = query.limit(PAGE_SIZE)
    if (offset > 0) {
      query = query.offset(offset)
    }

    const snapshot = await query.get()

    let data: SimRegistration[] = snapshot.docs.map(doc => {
      const docData = doc.data()
      return {
        id: doc.id,
        userId: docData.uid || '',
        cnic: docData.cnic || '',
        phoneNumber: docData.mobileNumber || '',
        simStatus: docData.status || 'Unknown', // Map 'status' field to 'simStatus'
        registrationDate: docData.registrationDate || docData.createdAt,
        operator: docData.networkProvider || '',
        simSerialNumber: docData.transactionId || '',
        orderStatus: docData.status || '',
        biometricStatus: docData.fingerprintVerificationStatus || '',
        // Keep additional fields for flexibility
        ...docData
      }
    }) as SimRegistration[]

    // Client-side filtering for search (if needed)
    if (search) {
      const searchLower = search.toLowerCase()
      data = data.filter(record =>
        record.cnic.toLowerCase().includes(searchLower) ||
        record.phoneNumber.includes(searchLower) ||
        record.operator.toLowerCase().includes(searchLower) ||
        record.simSerialNumber.includes(searchLower) ||
        record.simStatus.toLowerCase().includes(searchLower)
      )
    }

    // Recalculate pagination after filtering
    const filteredTotal = search ? data.length : total
    const hasNextPage = (page + 1) * PAGE_SIZE < filteredTotal

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        hasNextPage,
        total: filteredTotal,
      },
    })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch SIM data',
      },
      { status: 500 }
    )
  }
}
