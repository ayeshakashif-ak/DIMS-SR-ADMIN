// Vercel Cron Job to expire old vote requests
// Runs hourly - checks for votes that have exceeded 48 hour window

import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreA } from '@/lib/firebase-a-admin'
import { VoteRequest } from '@/lib/types'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase-admin/firestore'

/**
 * GET /api/cron/expire-votes
 * Cron job that runs hourly to auto-expire old vote requests
 */
export async function GET(request: NextRequest) {
  try {
    const firestoreA = getFirestoreA()

    // Verify cron secret
    const secret = request.headers.get('authorization')?.replace('Bearer ', '')
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = Timestamp.now()

    // Query for pending votes that have expired
    const q = query(
      collection(firestoreA, 'voteRequests'),
      where('status', '==', 'pending'),
      where('expiresAt', '<', now)
    )

    const snapshot = await getDocs(q)
    const expiredVotes: VoteRequest[] = []
    const updatePromises: Promise<void>[] = []

    snapshot.forEach((docSnap) => {
      const voteRequest = docSnap.data() as VoteRequest
      expiredVotes.push(voteRequest)

      // Mark as rejected due to expiration
      const updatePromise = updateDoc(docSnap.ref, {
        status: 'rejected',
        resolvedAt: now,
        resolvedOutcome: 'Expired - no consensus reached within 48 hours',
      })

      updatePromises.push(updatePromise)
    })

    // Wait for all updates to complete
    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      data: {
        expiredCount: expiredVotes.length,
        message: `Processed ${expiredVotes.length} expired vote requests`,
      },
    })
  } catch (error) {
    console.error('[Cron] Error in expire-votes:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Cron job failed',
      },
      { status: 500 }
    )
  }
}
