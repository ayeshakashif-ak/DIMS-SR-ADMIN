// API Route for Executing Approved Proposals

import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { getFirestoreA } from '@/lib/firebase-a-admin'
import { getFirestoreB } from '@/lib/firebase-b-admin'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/proposals/[id]/execute
 * Execute an approved proposal by updating DIMS-SR database
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const proposalId = params.id
    console.log('[Execute API] Executing proposal:', proposalId)

    const dbA = getFirestoreA() // Admin DB
    const dbB = getFirestoreB() // DIMS-SR DB

    // Get proposal
    const proposalDoc = await dbA.collection('proposals').doc(proposalId).get()
    if (!proposalDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Proposal not found'
      }, { status: 404 })
    }

    const proposal = proposalDoc.data()
    if (proposal?.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'Proposal is not approved'
      }, { status: 400 })
    }

    // Execute based on action type
    const { actionType, targetSimId, newValue } = proposal

    try {
      if (actionType === 'approve_sim') {
        // Update SIM status to approved
        await dbB.collection('sims').doc(targetSimId).update({
          status: 'approved',
          updatedAt: new Date()
        })
        console.log('[Execute API] SIM approved:', targetSimId)

      } else if (actionType === 'block_sim') {
        // Update SIM status to blocked
        await dbB.collection('sims').doc(targetSimId).update({
          status: 'blocked',
          updatedAt: new Date()
        })
        console.log('[Execute API] SIM blocked:', targetSimId)

      } else if (actionType === 'change_operator') {
        // Update SIM operator
        await dbB.collection('sims').doc(targetSimId).update({
          networkProvider: newValue,
          updatedAt: new Date()
        })
        console.log('[Execute API] SIM operator changed:', targetSimId, 'to', newValue)
      }

      // Mark proposal as executed
      await dbA.collection('proposals').doc(proposalId).update({
        status: 'executed',
        executedAt: new Date()
      })

      console.log('[Execute API] Proposal executed successfully')

      return NextResponse.json({
        success: true,
        message: 'Proposal executed successfully'
      })

    } catch (executionError: any) {
      console.error('[Execute API] Execution failed:', executionError)

      // Mark proposal as failed (you might want to add a 'failed' status)
      await dbA.collection('proposals').doc(proposalId).update({
        status: 'failed',
        error: executionError.message
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to execute proposal',
        details: executionError.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('[Execute API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to execute proposal',
      details: error.message
    }, { status: 500 })
  }
}