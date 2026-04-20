// API Route for Admin Signup with Email Domain Validation

import { NextRequest, NextResponse } from 'next/server'
import { getAuth as getAdminAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuthA, getFirestoreA } from '@/lib/firebase-a-admin'
import { validateEmailDomain } from '@/lib/email-validation'

/**
 * POST /api/signup
 * Create new admin account with email domain validation and automatic role assignment
 */
export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({
        success: false,
        error: 'All fields are required'
      }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters'
      }, { status: 400 })
    }

    // Validate email domain and assign role
    const validation = validateEmailDomain(email)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error || 'Invalid email domain'
      }, { status: 400 })
    }

    // Initialize Firebase Admin
    const auth = getAuthA()
    const db = getFirestoreA()

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    })

    // Store admin profile in Firestore
    const adminProfile = {
      uid: userRecord.uid,
      firstName,
      lastName,
      email,
      role: validation.role,
      createdAt: new Date()
    }

    await db.collection('admins').doc(userRecord.uid).set(adminProfile)

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        role: validation.role
      }
    })

  } catch (error: any) {
    console.error('[Signup API] Error:', error)

    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({
        success: false,
        error: 'Email already registered'
      }, { status: 400 })
    }

    if (error.code === 'auth/invalid-email') {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 })
    }

    if (error.code === 'auth/weak-password') {
      return NextResponse.json({
        success: false,
        error: 'Password is too weak'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create admin account',
      details: error.message
    }, { status: 500 })
  }
}