// Utility functions for RAFT voting and consensus logic
import { VoteRequest, VoteStatus, AdminRole } from './types'
import { Timestamp } from 'firebase/firestore'

/**
 * Calculate vote status based on current votes
 * Returns: { status: VoteStatus, reason: string }
 */
export function calculateVoteStatus(voteRequest: VoteRequest): {
  status: VoteStatus
  reason: string
} {
  const votes = Object.values(voteRequest.votes).filter((v) => v !== null)
  const approveCount = Object.values(voteRequest.votes).filter(
    (v) => v === 'approve'
  ).length
  const rejectCount = Object.values(voteRequest.votes).filter(
    (v) => v === 'reject'
  ).length

  // Check for majority approval (≥2 approves)
  if (approveCount >= 2) {
    return {
      status: 'approved',
      reason: `Approved by ${approveCount} admin(s)`,
    }
  }

  // Check for majority rejection (≥2 rejects)
  if (rejectCount >= 2) {
    return {
      status: 'rejected',
      reason: `Rejected by ${rejectCount} admin(s)`,
    }
  }

  return {
    status: 'pending',
    reason: 'Awaiting votes',
  }
}

/**
 * Check if a vote request has expired (48 hours)
 */
export function isVoteExpired(voteRequest: VoteRequest): boolean {
  const now = Timestamp.now()
  return now > voteRequest.expiresAt
}

/**
 * Get vote count summary
 */
export function getVoteSummary(
  voteRequest: VoteRequest
): { approves: number; rejects: number; pending: number } {
  const approves = Object.values(voteRequest.votes).filter(
    (v) => v === 'approve'
  ).length
  const rejects = Object.values(voteRequest.votes).filter(
    (v) => v === 'reject'
  ).length
  const pending = Object.values(voteRequest.votes).filter(
    (v) => v === null
  ).length

  return { approves, rejects, pending }
}

/**
 * Format time remaining until expiry
 */
export function getTimeRemaining(expiresAt: Timestamp): string {
  const now = Date.now()
  const expiryMs = expiresAt.toMillis()
  const diffMs = expiryMs - now

  if (diffMs <= 0) {
    return 'Expired'
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`
  }
  return `${minutes}m remaining`
}

/**
 * Check if admin has already voted
 */
export function hasAdminVoted(
  voteRequest: VoteRequest,
  adminRole: AdminRole
): boolean {
  return voteRequest.votes[adminRole] !== null
}

/**
 * Get admin's current vote
 */
export function getAdminVote(
  voteRequest: VoteRequest,
  adminRole: AdminRole
): 'approve' | 'reject' | null {
  return voteRequest.votes[adminRole]
}

/**
 * Create a vote request ID (timestamp + random)
 */
export function generateVoteRequestId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `vote-${timestamp}-${random}`
}
