'use client'

import { useState } from 'react'
import { ProtectedPage } from '@/components/protected-page'
import { DashboardHeader } from '@/components/dashboard-header'
import { NotificationPanel } from '@/components/notification-panel'
import { Button } from '@/components/ui/button'
import { Bell, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between w-full max-w-7xl">
            <DashboardHeader />
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setNotificationsOpen(true)}
                variant="ghost"
                size="sm"
                className="relative"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <main className="max-w-4xl mx-auto py-12 px-6">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Select an option to view and manage records
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Link href="/dashboard/sim-registrations">
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-8 text-center cursor-pointer border border-gray-200 hover:border-blue-300">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  SIM Registrations
                </h2>
                <p className="text-gray-600">
                  View SIM registration records
                </p>
              </div>
            </Link>

            <Link href="/dashboard/users">
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-8 text-center cursor-pointer border border-gray-200 hover:border-green-300">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Users
                </h2>
                <p className="text-gray-600">
                  View user management
                </p>
              </div>
            </Link>
          </div>
        </main>

        <NotificationPanel
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />
      </div>
    </ProtectedPage>
  )
}
