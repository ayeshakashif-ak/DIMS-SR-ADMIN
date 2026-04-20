// API Route to cast a vote on a RAFT vote request
import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreA } from '@/lib/firebase-a-admin'
import { getFirestoreB } from '@/lib/firebase-b-admin'
import { VoteRequest, AdminRole } from '@/lib/types'
import { calculateVoteStatus } from '@/lib/vote-utils'
import {
  doc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
  Timestamp,
  deleteDoc,
} from 'firebase-admin/firestore'

/**
 * POST /api/votes/cast
 * Cast a vote on a vote request
 */
export async function POST(request: NextRequest) {
  try {
    const firestoreA = getFirestoreA()

    const body = await request.json()
    const { voteRequestId, vote, userId, userRole } = body

    if (!voteRequestId || !vote || !userId || !userRole) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(vote)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vote value' },
        { status: 400 }
      )
    }

    // Get the vote request
    const voteDocRef = doc(firestoreA, 'voteRequests', voteRequestId)
    const voteDocSnap = await getDoc(voteDocRef)

    if (!voteDocSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Vote request not found' },
        { status: 404 }
      )
    }

    const voteRequest = voteDocSnap.data() as VoteRequest

    // Check if already voted
    if (voteRequest.votes[userRole as AdminRole] !== null) {
      return NextResponse.json(
        { success: false, error: 'You have already voted on this request' },
        { status: 400 }
      )
    }

    // Update the vote
    const updatedVotes = {
      ...voteRequest.votes,
      [userRole]: vote,
    }

    await updateDoc(voteDocRef, {
      votes: updatedVotes,
    })

    // Fetch the updated document
    const updatedSnap = await getDoc(voteDocRef)
    const updatedVote = updatedSnap.data() as VoteRequest

    // Check if consensus reached
    const { status, reason } = calculateVoteStatus(updatedVote)

    if (status !== 'pending') {
      // Consensus reached - execute or reject
      let resolvedOutcome = reason

      if (status === 'approved') {
        // Execute the change
        try {
          const firestoreB = getFirestoreB()
          if (updatedVote.operationType === 'delete') {
            // Delete the document from Firebase Project B
            await deleteDoc(
              doc(
                firestoreB,
                'simRegistrations',
                updatedVote.targetDocumentId
              )
            )
          } else if (updatedVote.operationType === 'edit') {
            // Update the document in Firebase Project B
            await updateDoc(
              doc(
                firestoreB,
                'simRegistrations',
                updatedVote.targetDocumentId
              ),
              updatedVote.proposedChanges
            )
          }
          resolvedOutcome = 'Approved and executed in database'
        } catch (dbError) {
          console.error('[Vote] Database execution error:', dbError)
          resolvedOutcome = `Approved but failed to execute: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
        }
      }

      // Mark vote as resolved
      await updateDoc(voteDocRef, {
        status,
        resolvedAt: Timestamp.now(),
        resolvedOutcome,
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedVote,
    })
  } catch (error) {
    console.error('[API] Error casting vote:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cast vote',
      },
      { status: 500 }
    )
  }
}
