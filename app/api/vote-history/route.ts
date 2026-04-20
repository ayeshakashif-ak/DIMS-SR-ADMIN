// API Route to fetch vote history from Firebase Project A

import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreA } from '@/lib/firebase-a-admin'

/**
 * GET /api/vote-history
 * Fetch approved/rejected vote requests from Firebase Project A
 * Query params: search=value, limit=number, offset=number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch vote history from Firebase Project A

    // Get Firestore instance for Project A
    const db = getFirestoreA()

    // Get all vote requests and filter/sort in memory to avoid index requirements
    const query = db.collection('voteRequests').limit(limit * 2) // Get more to account for filtering

    // Execute query
    const snapshot = await query.get()

    // Convert to our data structure and filter
    let votes: any[] = []
    snapshot.forEach(doc => {
      const data = doc.data()
      const status = data.status || ''
      if (status === 'approved' || status === 'rejected') {
        votes.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          status: status,
          createdBy: data.createdBy || '',
          createdAt: data.createdAt ? new Date(data.createdAt._seconds * 1000).toISOString() : new Date().toISOString(),
          approvedAt: data.approvedAt ? new Date(data.approvedAt._seconds * 1000).toISOString() : null,
          rejectedAt: data.rejectedAt ? new Date(data.rejectedAt._seconds * 1000).toISOString() : null,
          votesFor: data.votesFor || 0,
          votesAgainst: data.votesAgainst || 0,
          totalVotes: data.totalVotes || 0
        })
      }
    })

    // Sort by createdAt descending
    votes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Apply limit after sorting
    votes = votes.slice(0, limit)

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      votes = votes.filter(vote =>
        vote.title?.toLowerCase().includes(searchLower) ||
        vote.description?.toLowerCase().includes(searchLower) ||
        vote.createdBy?.toLowerCase().includes(searchLower) ||
        vote.status?.toLowerCase().includes(searchLower)
      )
    }

    // Apply offset
    if (offset > 0) {
      votes = votes.slice(offset)
    }

    const total = votes.length

    return NextResponse.json({
      success: true,
      data: votes,
      pagination: {
        total,
        limit,
        offset,
        hasNextPage: total === limit
      },
      note: "Data fetched from Firebase Project A - Vote History"
    })

  } catch (error) {
    console.error('[Vote History API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch vote history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}