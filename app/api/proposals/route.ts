// API Route for Proposal Management

import { NextRequest, NextResponse } from 'next/server'
import { getAuth as getAdminAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuthA, getFirestoreA } from '@/lib/firebase-a-admin'
import { Proposal, ProposalActionType } from '@/lib/types'

/**
 * POST /api/proposals
 * Create a new proposal
 */
export async function POST(request: NextRequest) {
  try {
    const { actionType, targetSimId, newValue, currentValue, description, requestedByUid } = await request.json()

    // Validate required fields
    if (!actionType || !targetSimId || !description || !requestedByUid) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Validate action type
    const validActions: ProposalActionType[] = ['approve_sim', 'block_sim', 'change_operator']
    if (!validActions.includes(actionType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action type'
      }, { status: 400 })
    }

    console.log('[Proposals API] Creating proposal:', { actionType, targetSimId, requestedByUid })

    // Get Firestore instance
    const db = getFirestoreA()

    // Verify requesting admin exists and get their role
    const adminDoc = await db.collection('admins').doc(requestedByUid).get()
    if (!adminDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Admin not found'
      }, { status: 404 })
    }

    const adminData = adminDoc.data()

    // Create proposal
    const proposalData: Omit<Proposal, 'id'> = {
      actionType,
      targetSimId,
      requestedBy: {
        uid: requestedByUid,
        role: adminData?.role
      },
      newValue: newValue || null,
      currentValue: currentValue || null,
      description,
      votes: {
        NADRA: null,
        PTA: null,
        TELCO: null
      },
      status: 'pending',
      createdAt: new Date()
    }

    // Add to Firestore
    const docRef = await db.collection('proposals').add(proposalData)

    console.log('[Proposals API] Proposal created with ID:', docRef.id)

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...proposalData
      }
    })

  } catch (error: any) {
    console.error('[Proposals API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create proposal',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * GET /api/proposals
 * Fetch proposals with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, approved, rejected, executed
    const adminUid = searchParams.get('adminUid') // Filter by admin who can vote

    console.log('[Proposals API] Fetching proposals:', { status, adminUid })

    const db = getFirestoreA()
    let query = db.collection('proposals').orderBy('createdAt', 'desc')

    if (status) {
      query = query.where('status', '==', status)
    }

    const snapshot = await query.get()

    const proposals: Proposal[] = []
    snapshot.forEach(doc => {
      const data = doc.data()
      proposals.push({
        id: doc.id,
        ...data
      } as Proposal)
    })

    // If filtering by admin UID, only return proposals where this admin hasn't voted yet
    let filteredProposals = proposals
    if (adminUid) {
      // Get admin's role
      const adminDoc = await db.collection('admins').doc(adminUid).get()
      if (adminDoc.exists) {
        const adminRole = adminDoc.data()?.role
        filteredProposals = proposals.filter(proposal =>
          proposal.status === 'pending' &&
          proposal.votes[adminRole] === null &&
          proposal.requestedBy.uid !== adminUid // Don't show own proposals
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: filteredProposals
    })

  } catch (error: any) {
    console.error('[Proposals API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch proposals',
      details: error.message
    }, { status: 500 })
  }
}