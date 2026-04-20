'use client'

import { useState, useEffect } from 'react'
import { ProtectedPage } from '@/components/protected-page'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { Proposal } from '@/lib/types'
import { getRoleLabel } from '@/lib/email-validation'

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [voting, setVoting] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchProposals = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (user?.uid) {
        params.set('adminUid', user.uid)
      }

      const response = await fetch(`/api/proposals?${params.toString()}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch proposals')
      }

      setProposals(data.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (proposalId: string, vote: 'approve' | 'reject') => {
    if (!user?.uid) return

    setVoting(proposalId)

    try {
      const response = await fetch(`/api/proposals/${proposalId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminUid: user.uid,
          vote,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to cast vote')
      }

      // Refresh proposals
      await fetchProposals()

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to vote'
      setError(message)
    } finally {
      setVoting(null)
    }
  }

  useEffect(() => {
    fetchProposals()
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchProposals, 30000)
    
    return () => clearInterval(interval)
  }, [user?.uid])

  const getActionDescription = (proposal: Proposal) => {
    switch (proposal.actionType) {
      case 'approve_sim':
        return `Approve SIM registration for ${proposal.targetSimId}`
      case 'block_sim':
        return `Block SIM registration for ${proposal.targetSimId}`
      case 'change_operator':
        return `Change operator from ${proposal.currentValue} to ${proposal.newValue} for ${proposal.targetSimId}`
      default:
        return proposal.description
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'executed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedPage>
      <div className="flex h-screen bg-background">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />

          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-6">
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <div className="mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-blue-700 text-sm">
                        <strong>📋 Proposal System</strong>
                        <br />
                        Review and vote on SIM registration changes. Requires majority approval (2+ votes) to execute.
                      </p>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Pending Proposals
                  </h2>

                  <Button
                    onClick={fetchProposals}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Refresh
                  </Button>
                </div>

                {error && (
                  <div className="m-6 bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div className="p-6">
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <Spinner />
                    </div>
                  ) : proposals.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        No pending proposals requiring your vote
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {proposals.map((proposal) => (
                        <div
                          key={proposal.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-bold text-gray-900">
                                {getActionDescription(proposal)}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Requested by {getRoleLabel(proposal.requestedBy.role)} on{' '}
                                {(() => {
                                  const date = proposal.createdAt;
                                  // Handle Firestore Timestamp (has toDate method) or regular Date
                                  const dateObj = date && typeof date.toDate === 'function' ? date.toDate() : new Date(date);
                                  return dateObj.toLocaleString();
                                })()}
                              </p>
                            </div>
                            <div>
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(proposal.status)}`}
                              >
                                {proposal.status.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-gray-700">{proposal.description}</p>
                          </div>

                          {/* Voting Status */}
                          <div className="mb-4">
                            <h4 className="font-semibold text-sm text-gray-900 mb-2">Votes:</h4>
                            <div className="grid grid-cols-3 gap-2">
                              {Object.entries(proposal.votes).map(([role, vote]) => (
                                <div key={role} className="text-center">
                                  <div className="text-xs text-gray-600">{role}</div>
                                  <div className={`text-sm font-semibold ${
                                    vote === 'approve' ? 'text-green-600' :
                                    vote === 'reject' ? 'text-red-600' :
                                    'text-gray-400'
                                  }`}>
                                    {vote === 'approve' ? '✓' :
                                     vote === 'reject' ? '✗' :
                                     '—'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Vote Buttons */}
                          {proposal.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleVote(proposal.id, 'approve')}
                                disabled={voting === proposal.id}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm"
                              >
                                {voting === proposal.id ? 'Voting...' : 'Approve'}
                              </Button>
                              <Button
                                onClick={() => handleVote(proposal.id, 'reject')}
                                disabled={voting === proposal.id}
                                className="bg-red-600 hover:bg-red-700 text-white text-sm"
                              >
                                {voting === proposal.id ? 'Voting...' : 'Reject'}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedPage>
  )
}