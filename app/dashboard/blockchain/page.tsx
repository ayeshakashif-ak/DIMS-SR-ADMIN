'use client'

import { useState, useEffect } from 'react'
import { ProtectedPage } from '@/components/protected-page'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'

export default function BlockchainPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchBlockchain = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)

      const response = await fetch(`/api/blockchain?${params.toString()}`)
      const json = await response.json()

      if (!response.ok || !json.success) {
        throw new Error(
          json.error || 'Failed to fetch blockchain transactions'
        )
      }

      setTransactions(json.data || [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBlockchain()
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const statusColor: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800',
    verified: 'bg-green-100 text-green-800',
    processing: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
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
                        <strong>ℹ️ SIM Registration Data</strong>
                        <br />
                        All SIM registrations from the DIMS-SR system are displayed below.
                        This data is fetched from Firebase Project B - DIMS-SR.
                      </p>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    SIM Registration Records
                  </h2>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search by CNIC, Mobile, Network Provider..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      onClick={fetchBlockchain}
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
                      onClick={fetchBlockchain}
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
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        No transactions found{search ? ' matching your search' : ''}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Transaction ID
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            CNIC
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Mobile Number
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Network Provider
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Registration Date
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Fingerprint Status
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {transactions.map((sim: any) => (
                          <tr key={sim.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-gray-900 font-mono text-xs">
                              {sim.transactionId?.substring(0, 16)}...
                            </td>
                            <td className="px-6 py-4 text-gray-700 font-mono text-sm">
                              {sim.cnic}
                            </td>
                            <td className="px-6 py-4 text-gray-700 font-mono text-sm">
                              {sim.mobileNumber}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              <span className="capitalize">{sim.networkProvider}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-700 text-xs">
                              {sim.registrationDate
                                ? new Date(sim.registrationDate).toLocaleString()
                                : sim.createdAt
                                ? new Date(sim.createdAt).toLocaleString()
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                sim.fingerprintVerificationStatus === 'verified'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {sim.fingerprintVerificationStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  statusColor[sim.status] ||
                                  statusColor['processing']
                                }`}
                              >
                                {sim.status}
                              </span>
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
