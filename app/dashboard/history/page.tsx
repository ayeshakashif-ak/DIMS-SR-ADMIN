'use client'

import { useState, useEffect } from 'react'
import { ProtectedPage } from '@/components/protected-page'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'

export default function HistoryPage() {
  const [votes, setVotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)

      const response = await fetch(`/api/vote-history?${params.toString()}`)
      const json = await response.json()

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch vote history')
      }

      setVotes(json.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory()
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const statusColor: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
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
                        <strong>📜 Vote History</strong>
                        <br />
                        View all approved and rejected change requests from the admin voting system.
                        Data is fetched from Firebase Project A.
                      </p>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Vote History
                  </h2>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search by title, description, or creator..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      onClick={fetchHistory}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="m-6 bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-700 text-sm">{error}</p>
                    <Button
                      onClick={fetchHistory}
                      className="mt-3 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
                    >
                      Retry
                    </Button>
                  </div>
                )}

                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <Spinner />
                    </div>
                  ) : votes.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        No vote history found{search ? ' matching your search' : ''}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Created By
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Votes
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Resolved
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {votes.map((vote) => (
                          <tr key={vote.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-gray-900">
                              <div>
                                <div className="font-medium">{vote.title}</div>
                                <div className="text-gray-500 text-xs mt-1 line-clamp-2">
                                  {vote.description}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {vote.createdBy}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  statusColor[vote.status] || 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {vote.status?.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              <div className="text-sm">
                                <span className="text-green-600">✓ {vote.votesFor || 0}</span>
                                {' / '}
                                <span className="text-red-600">✗ {vote.votesAgainst || 0}</span>
                                <div className="text-xs text-gray-500">
                                  Total: {vote.totalVotes || 0}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-700 text-xs">
                              {vote.createdAt ? new Date(vote.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-gray-700 text-xs">
                              {vote.approvedAt || vote.rejectedAt
                                ? new Date(vote.approvedAt || vote.rejectedAt).toLocaleDateString()
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
