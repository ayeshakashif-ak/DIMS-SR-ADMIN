// API Route to manage notifications for admin users
// This fetches the latest SIM requests from DIMS-SR Firebase database

import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreB } from '@/lib/firebase-b-admin'
import { Notification } from '@/lib/types'
import { getAuth } from 'firebase-admin/auth'
import { cookies } from 'next/headers'

/**
 * GET /api/notifications
 * Fetch the latest 3 SIM requests from DIMS-SR as notifications
 */
export async function GET(request: NextRequest) {
  try {
    // For SIM request notifications, we don't require strict authentication
    // since these are general notifications for all admins
    // We'll try to get the user ID but fall back gracefully

    let adminUid = 'admin' // Default fallback

    try {
      let sessionCookie
      try {
        sessionCookie = cookies().get('session')?.value
      } catch (cookieError) {
        // Try alternative method using request cookies
        const cookieHeader = request.headers.get('cookie')
        if (cookieHeader) {
          const parsedCookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
          }, {} as Record<string, string>)
          sessionCookie = parsedCookies['session']
        }
      }

      if (sessionCookie) {
        const auth = getAuth()
        const decodedClaims = await auth.verifySessionCookie(sessionCookie)
        adminUid = decodedClaims.uid
      }
    } catch (authError) {
      // Authentication failed, but we'll still show notifications
    }

    // Fetch the latest 3 SIM records from DIMS-SR database
    const firestore = getFirestoreB()
    const simsRef = firestore.collection('sims')
    const snapshot = await simsRef
      .orderBy('registrationDate', 'desc')
      .limit(3)
      .get()

    // Transform SIM records into notifications
    const notifications: Notification[] = snapshot.docs.map((doc, index) => {
      const simData = doc.data()
      return {
        id: `sim-${doc.id}`,
        adminUid: adminUid,
        type: 'sim-request',
        voteRequestId: doc.id,
        title: `SIM Request ${index + 1}`,
        message: `CNIC: ${simData.cnic}`,
        read: false,
        createdAt: simData.registrationDate || simData.createdAt || new Date(),
        relatedAdminRole: 'ALL' // All admins should see SIM requests
      }
    })

    return NextResponse.json({
      success: true,
      data: notifications,
    })
  } catch (error) {
    console.error('[API] Error fetching SIM notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications
 * Mark a notification as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const { notificationId, read } = await request.json()

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID required' },
        { status: 400 }
      )
    }

    const firestore = getFirestoreA()
    const notificationRef = firestore.collection('notifications').doc(notificationId)

    await notificationRef.update({
      read: read,
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[API] Error updating notification:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update notification',
      },
      { status: 500 }
    )
  }
}