'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { validateEmailDomain, getRoleLabel } from '@/lib/email-validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [assignedRole, setAssignedRole] = useState<string | null>(null)
  const router = useRouter()

  // Validate email domain on change
  const handleEmailChange = (value: string) => {
    setEmail(value)
    setAssignedRole(null)
    setError(null)

    if (value.includes('@')) {
      const validation = validateEmailDomain(value)
      if (validation.isValid && validation.role) {
        setAssignedRole(getRoleLabel(validation.role))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('All fields are required')
      return
    }

    // Validate email domain
    const validation = validateEmailDomain(email)
    if (!validation.isValid) {
      setError(validation.error || 'Invalid email domain')
      return
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Signup failed')
      }

      setSuccess(true)

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            DIMS-Admin Portal
          </h1>
          <p className="text-gray-600 mb-6">
            Create your administrator account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="admin@nadra.gov.pk"
                required
                disabled={loading}
              />
              {assignedRole && (
                <p className="text-green-600 text-sm mt-1">
                  ✓ Assigned Role: {assignedRole}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-green-700 text-sm">
                  Account created successfully! Redirecting to login...
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || success}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
            >
              {loading ? 'Creating account...' : success ? 'Account Created!' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
