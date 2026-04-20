'use client'

import { useState, useEffect } from 'react'
import { ProtectedPage } from '@/components/protected-page'
import { DashboardHeader } from '@/components/dashboard-header'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)

      const response = await fetch(`/api/users?${params.toString()}`)
      const json = await response.json()

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch users')
      }

      setUsers(json.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending_mfa: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800',
  }

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
                Users
              </h1>

              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by email, name, or CNIC..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                  <Button
                    onClick={fetchUsers}
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No users found{search ? ' matching your search' : ''}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          CNIC
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          MFA Status
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Account Status
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Registered SIMs
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-900">
                            {user.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-mono text-sm">
                            {user.cnic}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              user.mfaEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                statusColor[user.accountStatus] || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {user.accountStatus?.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {user.registeredSims?.length || 0}
                          </td>
                          <td className="px-6 py-4 text-gray-700 text-xs">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedPage>
  )
}