// API Route to create a new RAFT vote request
// Server-side only - handles vote creation and notifications

import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreA } from '@/lib/firebase-a-admin'
import { VoteRequest, OperationType, AdminRole } from '@/lib/types'
import { generateVoteRequestId } from '@/lib/vote-utils'
import { collection, addDoc, Timestamp } from 'firebase-admin/firestore'

/**
 * POST /api/votes/create
 * Create a new RAFT vote request
 * Body: { operationType, targetDocumentId, proposedChanges, originalData }
 */
export async function POST(request: NextRequest) {
  try {
    const firestoreA = getFirestoreA()

    // Get the authenticated user from the request
    // In a real app, you'd extract the user from a session or JWT
    const body = await request.json()
    const {
      operationType,
      targetDocumentId,
      proposedChanges,
      originalData,
      userId,
      userRole,
    } = body

    if (!operationType || !targetDocumentId || !originalData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!userId || !userRole) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Create the vote request document
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromDate(
      new Date(now.toDate().getTime() + 48 * 60 * 60 * 1000)
    ) // 48 hours

    const voteRequest: VoteRequest = {
      requestId: generateVoteRequestId(),
      operationType: operationType as OperationType,
      targetCollection: 'simRegistrations',
      targetDocumentId,
      proposedChanges,
      originalData,
      initiatedBy: {
        uid: userId,
        role: userRole as AdminRole,
      },
      status: 'pending',
      votes: {
        NADRA: null,
        PTA: null,
        Telco: null,
      },
      createdAt: now,
      expiresAt,
      resolvedAt: null,
      resolvedOutcome: null,
    }

    // Save to Firestore
    const docRef = await addDoc(
      collection(firestoreA, 'voteRequests'),
      voteRequest
    )

    return NextResponse.json({
      success: true,
      data: {
        requestId: docRef.id,
        ...voteRequest,
      },
    })
  } catch (error) {
    console.error('[API] Error creating vote request:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create vote request',
      },
      { status: 500 }
    )
  }
}
