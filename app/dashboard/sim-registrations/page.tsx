'use client'

import { useState, useEffect } from 'react'
import { ProtectedPage } from '@/components/protected-page'
import { DashboardHeader } from '@/components/dashboard-header'
import { SimRegistration } from '@/lib/types'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SimRegistrationsPage() {
  const [data, setData] = useState<SimRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 20,
    hasNextPage: false,
    total: 0,
  })

  // Fetch data when page or search changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        if (search) params.set('search', search)

        const response = await fetch(`/api/sim?${params.toString()}`)
        const json = await response.json()

        if (!response.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch SIM data')
        }

        setData(json.data)
        setPagination(json.pagination)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An error occurred'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchData()
    }, 300) // Debounce search

    return () => clearTimeout(timer)
  }, [page, search])

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
          <DashboardHeader />
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <main className="max-w-6xl mx-auto py-8 px-6">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                SIM Registrations
              </h1>

              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by CNIC, phone, operator..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(0)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Phone Number
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Operator
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          CNIC
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-900">
                            {record.phoneNumber || record.mobileNumber}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {record.operator || record.networkProvider}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {record.cnic}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {record.simStatus || 'Unknown'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {data.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">
                      No SIM registrations found
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {pagination.hasNextPage && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => setPage(page + 1)}
                    disabled={loading}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedPage>
  )
}