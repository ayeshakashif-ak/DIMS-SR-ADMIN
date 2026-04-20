'use client'

import { useState } from 'react'
import { SimRegistration } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

interface EditDeleteModalProps {
  record: SimRegistration
  action: 'edit' | 'delete'
  onClose: () => void
}

export function EditDeleteModal({
  record,
  action,
  onClose,
}: EditDeleteModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editedFields, setEditedFields] = useState<Record<string, any>>(
    action === 'edit'
      ? {
          simStatus: record.simStatus,
          operator: record.operator,
        }
      : {}
  )
  const { user } = useAuth()

  const handleEditFieldChange = (field: string, value: any) => {
    setEditedFields((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleConfirm = async () => {
    if (!user) {
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/votes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationType: action,
          targetDocumentId: record.id,
          proposedChanges: action === 'edit' ? editedFields : null,
          originalData: record,
          userId: user.uid,
          userRole: user.role,
        }),
      })

      const json = await response.json()

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to create vote request')
      }

      // Show success and close modal
      alert(`Vote request created. All admins have been notified.`)
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {action === 'edit' ? 'Edit SIM Registration' : 'Delete SIM Registration'}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm text-gray-600 mb-1">
              <strong>CNIC:</strong>
            </p>
            <p className="text-gray-900">{record.cnic}</p>
          </div>

          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm text-gray-600 mb-1">
              <strong>Phone:</strong>
            </p>
            <p className="text-gray-900">{record.phoneNumber}</p>
          </div>

          {action === 'edit' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SIM Status
                </label>
                <select
                  value={editedFields.simStatus}
                  onChange={(e) =>
                    handleEditFieldChange('simStatus', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operator
                </label>
                <input
                  type="text"
                  value={editedFields.operator}
                  onChange={(e) =>
                    handleEditFieldChange('operator', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {action === 'delete' && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-700 text-sm">
                <strong>Warning:</strong> This will submit a delete request to all
                admins. The record will only be deleted after consensus approval.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <Button
            onClick={onClose}
            disabled={loading}
            className="bg-gray-300 hover:bg-gray-400 text-gray-900"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={`text-white ${
              action === 'delete'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading
              ? 'Submitting...'
              : action === 'edit'
                ? 'Submit Edit for Vote'
                : 'Submit Delete for Vote'}
          </Button>
        </div>
      </div>
    </div>
  )
}
