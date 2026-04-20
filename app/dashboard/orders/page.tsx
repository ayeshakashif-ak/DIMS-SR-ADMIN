'use client'

import { useState, useEffect } from 'react'
import { ProtectedPage } from '@/components/protected-page'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)

      const response = await fetch(`/api/orders?${params.toString()}`)
      const json = await response.json()

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch orders')
      }

      setOrders(json.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders()
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const statusColor: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    'in-transit': 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
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
                    <div className="bg-orange-50 border border-orange-200 rounded p-3">
                      <p className="text-orange-700 text-sm">
                        <strong>📦 Order Management</strong>
                        <br />
                        Track and manage SIM card delivery orders from the DIMS-SR system.
                        Data is fetched from Firebase Project B - DIMS-SR.
                      </p>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    SIM Delivery Orders
                  </h2>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search by transaction ID, tracking number..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <Button
                      onClick={fetchOrders}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="m-6 bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-700 text-sm">{error}</p>
                    <Button
                      onClick={fetchOrders}
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
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        No orders found{search ? ' matching your search' : ''}
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
                            Tracking Number
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            SIM ID
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Order Date
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Estimated Delivery
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-900">
                            Timeline
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-gray-900 font-mono text-xs">
                              {order.transactionId?.substring(0, 20)}...
                            </td>
                            <td className="px-6 py-4 text-gray-700 font-mono text-xs">
                              {order.trackingNumber}
                            </td>
                            <td className="px-6 py-4 text-gray-700 font-mono text-xs">
                              {order.simId?.substring(0, 16)}...
                            </td>
                            <td className="px-6 py-4 text-gray-700 text-xs">
                              {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-gray-700 text-xs">
                              {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  statusColor[order.status] || 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-700 text-xs">
                              {order.timeline?.length ? `${order.timeline.length} steps` : 'N/A'}
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