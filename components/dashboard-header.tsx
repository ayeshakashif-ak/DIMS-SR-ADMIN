'use client'

import { useAuth } from '@/lib/auth-context'
import { AdminRole } from '@/lib/types'
import { getRoleLabel, getRoleLogo } from '@/lib/email-validation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

const roleBgColor: Record<AdminRole, string> = {
  NADRA: 'bg-purple-100 text-purple-800',
  PTA: 'bg-blue-100 text-blue-800',
  TELCO: 'bg-green-100 text-green-800',
}

export function DashboardHeader() {
  const { user, loading, refreshUserRole } = useAuth()

  const roleLogo = user ? getRoleLogo(user.role) : null

  // Force re-render when user changes
  const userKey = user ? `${user.uid}-${user.role}` : 'no-user'

  const handleRefreshRole = async () => {
    try {
      await refreshUserRole()
    } catch (error) {
      console.error('Failed to refresh role:', error)
    }
  }

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <header key={`loading-${userKey}`} className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header key={`header-${userKey}`} className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - Logo */}
        <div className="flex items-center">
          {roleLogo && (
            <Image
              src={roleLogo}
              alt={`${user?.role} Logo`}
              width={40}
              height={40}
              className="rounded"
            />
          )}
        </div>

        {/* Center - Role Badge with Refresh */}
        <div className="flex-1 flex justify-center items-center gap-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              roleBgColor[user.role]
            }`}
          >
            {getRoleLabel(user.role)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshRole}
            className="h-6 w-6 p-0"
            title="Refresh role"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>

        {/* Right side - User info only */}
        <div className="flex items-center">
          {user && (
            <div className="flex flex-col items-end">
              <p className="text-sm font-medium text-gray-900">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
