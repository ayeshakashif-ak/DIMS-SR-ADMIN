// API Route for Voting on Proposals

import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { getFirestoreA } from '@/lib/firebase-a-admin'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/proposals/[id]/vote
 * Cast a vote on a proposal
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { adminUid, vote } = await request.json() // vote: 'approve' | 'reject'

    if (!adminUid || !vote || !['approve', 'reject'].includes(vote)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid vote data'
      }, { status: 400 })
    }

    const proposalId = params.id
    console.log('[Vote API] Processing vote:', { proposalId, adminUid, vote })

    const db = getFirestoreA()

    // Get proposal
    const proposalDoc = await db.collection('proposals').doc(proposalId).get()
    if (!proposalDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Proposal not found'
      }, { status: 404 })
    }

    const proposal = proposalDoc.data()
    if (proposal?.status !== 'pending') {
      return NextResponse.json({
        success: false,
        error: 'Proposal is not pending'
      }, { status: 400 })
    }

    // Get admin's role
    const adminDoc = await db.collection('admins').doc(adminUid).get()
    if (!adminDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Admin not found'
      }, { status: 404 })
    }

    const adminRole = adminDoc.data()?.role
    if (!adminRole) {
      return NextResponse.json({
        success: false,
        error: 'Admin role not found'
      }, { status: 404 })
    }

    // Check if admin already voted
    if (proposal.votes[adminRole] !== null) {
      return NextResponse.json({
        success: false,
        error: 'Admin has already voted'
      }, { status: 400 })
    }

    // Update vote
    const updatedVotes = {
      ...proposal.votes,
      [adminRole]: vote
    }

    // Check if we have majority
    const votes = Object.values(updatedVotes)
    const approveCount = votes.filter(v => v === 'approve').length
    const rejectCount = votes.filter(v => v === 'reject').length
    const totalVotes = votes.filter(v => v !== null).length

    let newStatus = 'pending'
    let approvedAt = null

    // Need majority (2+ approvals or 2+ rejections)
    if (approveCount >= 2) {
      newStatus = 'approved'
      approvedAt = new Date()
    } else if (rejectCount >= 2) {
      newStatus = 'rejected'
    }

    // Update proposal
    await db.collection('proposals').doc(proposalId).update({
      votes: updatedVotes,
      status: newStatus,
      ...(approvedAt && { approvedAt })
    })

    console.log('[Vote API] Vote recorded, new status:', newStatus)

    // If approved, trigger execution
    if (newStatus === 'approved') {
      console.log('[Vote API] Proposal approved, triggering execution')
      try {
        // Execute the proposal immediately
        const execResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/proposals/${proposalId}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (!execResponse.ok) {
          console.error('[Vote API] Failed to execute proposal')
        } else {
          console.log('[Vote API] Proposal executed successfully')
        }
      } catch (execError) {
        console.error('[Vote API] Execution error:', execError)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        proposalId,
        newStatus,
        votes: updatedVotes
      }
    })

  } catch (error: any) {
    console.error('[Vote API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to cast vote',
      details: error.message
    }, { status: 500 })
  }
}