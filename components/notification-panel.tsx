'use client'

import { useState, useEffect } from 'react'
import { Notification } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications()
    }
  }, [isOpen, user])

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()

      if (response.ok && data.success) {
        setNotifications(data.data)
      } else {
        // Handle various error cases gracefully
        if (response.status === 401 || response.status === 500 || data.error?.includes('Authentication') || data.error?.includes('Unauthorized')) {
          setNotifications([])
        } else {
          console.error('Failed to fetch notifications:', data.error)
          setNotifications([])
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    // For SIM request notifications, just update local state
    // (these are read-only notifications from DIMS-SR database)
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4">
      <div className="bg-white rounded-lg shadow-xl w-96 max-h-96 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 ${!notification.read ? 'bg-blue-50' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {(() => {
                          const date = notification.createdAt;
                          // Handle Firestore Timestamp (has toDate method) or regular Date
                          const dateObj = date && typeof date.toDate === 'function' ? date.toDate() : new Date(date);
                          return dateObj.toLocaleString();
                        })()}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        onClick={() => markAsRead(notification.id)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}