'use client'

import { SimRegistration } from '@/lib/types'

interface SimDataTableProps {
  data: SimRegistration[]
}

const statusColorMap: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  blocked: { bg: 'bg-red-100', text: 'text-red-800' },
  completed: { bg: 'bg-blue-100', text: 'text-blue-800' },
}

export function SimDataTable({ data }: SimDataTableProps) {
  const getStatusColor = (status: string) => {
    return statusColorMap[status] || statusColorMap['pending']
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-3 text-left font-semibold text-gray-900">
            CNIC
          </th>
          <th className="px-6 py-3 text-left font-semibold text-gray-900">
            Phone Number
          </th>
          <th className="px-6 py-3 text-left font-semibold text-gray-900">
            SIM Status
          </th>
          <th className="px-6 py-3 text-left font-semibold text-gray-900">
            Operator
          </th>
          <th className="px-6 py-3 text-left font-semibold text-gray-900">
            SIM Serial
          </th>
          <th className="px-6 py-3 text-left font-semibold text-gray-900">
            Registration Date
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((record) => {
          const statusColor = getStatusColor(record.simStatus)
          const regDate = record.registrationDate
            ? new Date(
                (record.registrationDate as any).toDate?.() ||
                  record.registrationDate
              ).toLocaleDateString()
            : 'N/A'

          return (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-gray-900 font-medium">
                {record.cnic}
              </td>
              <td className="px-6 py-4 text-gray-700">
                {record.phoneNumber}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}
                >
                  {record.simStatus}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-700">{record.operator}</td>
              <td className="px-6 py-4 text-gray-700">
                {record.simSerialNumber}
              </td>
              <td className="px-6 py-4 text-gray-700">{regDate}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
