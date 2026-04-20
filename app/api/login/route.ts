// API Route for Admin Login - Fetch Role from Firestore

import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { getFirestoreA } from '@/lib/firebase-a-admin'

/**
 * POST /api/login
 * Fetch admin profile and role from Firestore after Firebase Auth login
 */
export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json()

    if (!uid) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Get Firestore instance
    const db = getFirestoreA()

    // Fetch admin profile
    const adminDoc = await db.collection('admins').doc(uid).get()

    if (!adminDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Admin profile not found'
      }, { status: 404 })
    }

    const adminData = adminDoc.data()

    return NextResponse.json({
      success: true,
      data: {
        uid: adminData?.uid,
        firstName: adminData?.firstName,
        lastName: adminData?.lastName,
        email: adminData?.email,
        role: adminData?.role,
        createdAt: adminData?.createdAt
      }
    })

  } catch (error: any) {
    console.error('[Login API] Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch admin profile',
      details: error.message
    }, { status: 500 })
  }
}