'use client'

import { useState, useEffect } from 'react'
import { ProtectedPage } from '@/components/protected-page'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { ProposalActionType } from '@/lib/types'

interface SimData {
  id: string
  cnic: string
  mobileNumber: string
  networkProvider: string
  status: string
}

export default function CreateProposalPage() {
  const [sims, setSims] = useState<SimData[]>([])
  const [selectedSim, setSelectedSim] = useState<string>('')
  const [actionType, setActionType] = useState<ProposalActionType>('approve_sim')
  const [newOperator, setNewOperator] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { user } = useAuth()

  // Fetch SIM data
  const fetchSims = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/blockchain')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch SIM data')
      }

      setSims(data.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load SIM data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    if (!selectedSim || !description) {
      setError('Please fill in all required fields')
      setSubmitting(false)
      return
    }

    if (!user?.uid) {
      setError('User not authenticated')
      setSubmitting(false)
      return
    }

    try {
      const selectedSimData = sims.find(sim => sim.id === selectedSim)
      if (!selectedSimData) {
        throw new Error('Selected SIM not found')
      }

      let newValue = null
      let currentValue = selectedSimData.status

      if (actionType === 'change_operator') {
        if (!newOperator) {
          setError('Please select a new operator')
          setSubmitting(false)
          return
        }
        newValue = newOperator
        currentValue = selectedSimData.networkProvider
      }

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionType,
          targetSimId: selectedSim,
          newValue,
          currentValue,
          description,
          requestedByUid: user.uid,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create proposal')
      }

      setSuccess(true)
      // Reset form
      setSelectedSim('')
      setActionType('approve_sim')
      setNewOperator('')
      setDescription('')

      setTimeout(() => setSuccess(false), 3000)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create proposal'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    fetchSims()
  }, [])

  const getActionDescription = (action: ProposalActionType) => {
    switch (action) {
      case 'approve_sim':
        return 'Approve SIM registration'
      case 'block_sim':
        return 'Block SIM registration'
      case 'change_operator':
        return 'Change network operator'
      default:
        return action
    }
  }

  const handleVote = async (
    voteRequestId: string,
    vote: 'approve' | 'reject'
  ) => {
    if (!user) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/votes/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voteRequestId,
          vote,
          userId: user.uid,
          userRole: user.role,
        }),
      })

      const json = await response.json()

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to cast vote')
      }

      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedPage>
      <div className="flex h-screen bg-background">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />

          <main className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto p-6">
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <div className="mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-blue-700 text-sm">
                        <strong>âž• Create Proposal</strong>
                        <br />
                        Submit changes to SIM registrations for approval by other administrators.
                      </p>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Create New Proposal
                  </h2>
                </div>

                <div className="p-6">
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-green-700 text-sm">
                        Proposal created successfully! It will be reviewed by other administrators.
                      </p>
                    </div>
                  )}

                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <Spinner />
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* SIM Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select SIM Registration *
                        </label>
                        <select
                          value={selectedSim}
                          onChange={(e) => setSelectedSim(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Choose a SIM registration...</option>
                          {sims.map((sim) => (
                            <option key={sim.id} value={sim.id}>
                              {sim.cnic} - {sim.mobileNumber} ({sim.networkProvider}) - {sim.status}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Action Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Action Type *
                        </label>
                        <select
                          value={actionType}
                          onChange={(e) => setActionType(e.target.value as ProposalActionType)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="approve_sim">Approve SIM Registration</option>
                          <option value="block_sim">Block SIM Registration</option>
                          <option value="change_operator">Change Network Operator</option>
                        </select>
                      </div>

                      {/* New Operator (only for change_operator) */}
                      {actionType === 'change_operator' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Network Operator *
                          </label>
                          <select
                            value={newOperator}
                            onChange={(e) => setNewOperator(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select new operator...</option>
                            <option value="Jazz">Jazz</option>
                            <option value="Ufone">Ufone</option>
                            <option value="Zong">Zong</option>
                            <option value="Warid">Warid</option>
                          </select>
                        </div>
                      )}

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description/Reason *
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Explain why this change is needed..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                          required
                        />
                      </div>

                      {/* Preview */}
                      {selectedSim && (
                        <div className="bg-gray-50 border border-gray-200 rounded p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Proposal Preview:</h3>
                          <p className="text-sm text-gray-700">
                            <strong>Action:</strong> {getActionDescription(actionType)}
                            <br />
                            <strong>Target SIM:</strong> {sims.find(s => s.id === selectedSim)?.mobileNumber}
                            {actionType === 'change_operator' && newOperator && (
                              <>
                                <br />
                                <strong>New Operator:</strong> {newOperator}
                              </>
                            )}
                          </p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={submitting || !selectedSim}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
                      >
                        {submitting ? 'Creating Proposal...' : 'Create Proposal'}
                      </Button>
                    </form>
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
