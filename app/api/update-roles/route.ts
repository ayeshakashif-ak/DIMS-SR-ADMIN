// API Route to update admin roles based on email domains

import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { getFirestoreA } from '@/lib/firebase-a-admin'
import { validateEmailDomain } from '@/lib/email-validation'

/**
 * POST /api/update-roles
 * Update admin roles for existing users based on their email domains
 */
export async function POST(request: NextRequest) {
  try {
    // Get Firestore instance
    const db = getFirestoreA()

    // Get all admin documents
    const adminsRef = db.collection('admins')
    const snapshot = await adminsRef.get()

    if (snapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'No admin records found'
      }, { status: 404 })
    }

    const updates = []
    const errors = []

    // Process each admin
    for (const doc of snapshot.docs) {
      const adminData = doc.data()
      const email = adminData.email

      if (!email) {
        errors.push(`Admin ${doc.id} has no email`)
        continue
      }

      // Validate email domain and get correct role
      const validation = validateEmailDomain(email)
      if (!validation.isValid) {
        errors.push(`Admin ${doc.id} (${email}) has invalid email domain`)
        continue
      }

      const currentRole = adminData.role
      const correctRole = validation.role

      if (currentRole !== correctRole) {
        // Update the role
        await doc.ref.update({ role: correctRole })
        updates.push({
          uid: doc.id,
          email,
          oldRole: currentRole,
          newRole: correctRole
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Role update completed. ${updates.length} roles updated, ${errors.length} errors.`,
      data: {
        updates,
        errors
      }
    })

  } catch (error: any) {
    console.error('[Update Roles API] Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to update roles',
      details: error.message
    }, { status: 500 })
  }
}