// API Route to fetch users from DIMS-SR database

import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreB } from '@/lib/firebase-b-admin'

/**
 * GET /api/users
 * Fetch user accounts from DIMS-SR database
 * Query params: search=value, limit=number, offset=number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch users from DIMS-SR database

    // Get Firestore instance for DIMS-SR project
    const db = getFirestoreB()

    // Build query - get users ordered by creation date (newest first)
    let query = db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(limit)

    // Execute query
    const snapshot = await query.get()

    // Convert to our data structure
    let users: any[] = []
    snapshot.forEach(doc => {
      const data = doc.data()
      users.push({
        id: doc.id,
        uid: data.uid || '',
        email: data.email || '',
        name: data.name || '',
        fatherName: data.fatherName || '',
        cnic: data.cnic || '',
        cnicIssueDate: data.cnicIssueDate || null,
        dateOfBirth: data.dateOfBirth || null,
        nadraVerified: data.nadraVerified || false,
        accountStatus: data.accountStatus || 'unknown',
        mfaEnabled: data.mfaEnabled || false,
        mfaRequired: data.mfaRequired || false,
        mfaVerified: data.mfaVerified || false,
        loginAttempts: data.loginAttempts || 0,
        registeredSims: data.registeredSims || [],
        deactivatedSims: data.deactivatedSims || [],
        createdAt: data.createdAt ? new Date(data.createdAt._seconds * 1000).toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt._seconds * 1000).toISOString() : null
      })
    })

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      users = users.filter(user =>
        user.email?.toLowerCase().includes(searchLower) ||
        user.name?.toLowerCase().includes(searchLower) ||
        user.cnic?.toLowerCase().includes(searchLower) ||
        user.accountStatus?.toLowerCase().includes(searchLower)
      )
    }

    // Apply offset
    if (offset > 0) {
      users = users.slice(offset)
    }

    const total = users.length

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        total,
        limit,
        offset,
        hasNextPage: total === limit
      },
      note: "Data fetched from Firebase Project B - DIMS-SR (Users)"
    })

  } catch (error) {
    console.error('[DIMS-SR API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}