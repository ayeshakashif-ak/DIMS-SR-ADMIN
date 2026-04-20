'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Auth, User as FirebaseUser } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import { AdminRole, AdminProfile, AuthContextType, AuthUser } from './types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Lazy initialize Firebase on client only
let firebaseInitialized = false
let authA: Auth | null = null
let firestoreA: Firestore | null = null

const initializeFirebase = async () => {
  if (firebaseInitialized || typeof window === 'undefined') {
    return
  }

  try {
    const { authA: auth, firestoreA: fs } = await import('./firebase-a')
    authA = auth
    firestoreA = fs
    firebaseInitialized = true
  } catch (error) {
    console.error('[Auth] Firebase initialization error:', error)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize Firebase and setup auth listener
  useEffect(() => {
    const setupAuth = async () => {
      try {
        await initializeFirebase()

        if (!authA || !firestoreA) {
          setError('Firebase not initialized')
          setLoading(false)
          return
        }

        const {
          onAuthStateChanged,
        } = await import('firebase/auth')
        const { doc, getDoc } = await import('firebase/firestore')

        const unsubscribe = onAuthStateChanged(authA, async (firebaseUser) => {
          try {
            if (firebaseUser) {
              // Fetch admin profile from our API
              try {
                const response = await fetch('/api/login', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ uid: firebaseUser.uid }),
                })

                const data = await response.json()

                if (response.ok && data.success) {
                  const adminData = data.data
                  setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    firstName: adminData.firstName,
                    lastName: adminData.lastName,
                    role: adminData.role,
                  })
                } else {
                  console.error('[Auth] Failed to fetch admin profile:', data.error)
                  // Sign out user if admin profile not found
                  try {
                    const { signOut } = await import('firebase/auth')
                    if (authA) {
                      await signOut(authA)
                    }
                  } catch (signOutError) {
                    console.error('[Auth] Failed to sign out:', signOutError)
                  }
                  setError('Access denied: Admin profile not found')
                  setUser(null)
                }
              } catch (apiError) {
                console.warn('[Auth] API call failed, using default role:', apiError)
                // Still allow authentication even if API fails
                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  role: 'NADRA', // Default role
                })
              }
            } else {
              setUser(null)
            }
          } catch (err) {
            console.error('[Auth] Error in auth state change:', err)
            setError('Authentication initialization failed')
          } finally {
            setLoading(false)
          }
        })

        return () => unsubscribe()
      } catch (err) {
        console.error('[Auth] Setup error:', err)
        setError('Authentication initialization failed')
        setLoading(false)
      }
    }

    const cleanup = setupAuth()
    return () => {
      cleanup.then((fn) => fn?.())
    }
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, role: AdminRole) => {
      setError(null)
      try {
        await initializeFirebase()

        if (!authA || !firestoreA) {
          throw new Error('Firebase not initialized')
        }

        const {
          createUserWithEmailAndPassword,
        } = await import('firebase/auth')
        const { doc, setDoc, Timestamp } = await import('firebase/firestore')

        const userCredential = await createUserWithEmailAndPassword(
          authA,
          email,
          password
        )

        // Try to create admin profile, but don't fail if Firestore access is denied
        try {
          const adminProfile: AdminProfile = {
            uid: userCredential.user.uid,
            email,
            role,
            createdAt: Timestamp.now(),
          }

          await setDoc(
            doc(firestoreA, 'adminProfiles', userCredential.user.uid),
            adminProfile
          )
        } catch (firestoreError) {
          console.warn('[Auth] Could not save admin profile to Firestore:', firestoreError)
          // Continue with authentication even if Firestore write fails
        }

        setUser({
          uid: userCredential.user.uid,
          email,
          role,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Signup failed'
        setError(message)
        console.error('[Auth] Signup failed:', err)
        throw err
      }
    },
    []
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null)
      try {
        await initializeFirebase()

        if (!authA || !firestoreA) {
          throw new Error('Firebase not initialized')
        }

        const {
          signInWithEmailAndPassword,
        } = await import('firebase/auth')
        const { doc, getDoc } = await import('firebase/firestore')

        const userCredential = await signInWithEmailAndPassword(
          authA,
          email,
          password
        )

        // Try to fetch admin profile, but use default role if Firestore access fails
        try {
          const adminDocRef = doc(
            firestoreA,
            'adminProfiles',
            userCredential.user.uid
          )
          const adminDocSnap = await getDoc(adminDocRef)

          if (adminDocSnap.exists()) {
            const adminData = adminDocSnap.data() as AdminProfile
            setUser({
              uid: userCredential.user.uid,
              email: userCredential.user.email || '',
              role: adminData.role,
            })
          } else {
            // No profile exists, use default role
            setUser({
              uid: userCredential.user.uid,
              email: userCredential.user.email || '',
              role: 'NADRA',
            })
          }
        } catch (firestoreError) {
          console.warn('[Auth] Could not read admin profile from Firestore:', firestoreError)
          // Still allow login even if Firestore read fails
          setUser({
            uid: userCredential.user.uid,
            email: userCredential.user.email || '',
            role: 'NADRA', // Default role
          })
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Login failed. Please try again.'
        setError(message)
        throw err
      }
    },
    []
  )

  const logout = useCallback(async () => {
    setError(null)
    try {
      await initializeFirebase()

      if (!authA) {
        throw new Error('Firebase not initialized')
      }

      const { signOut } = await import('firebase/auth')
      await signOut(authA)
      setUser(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed'
      setError(message)
      throw err
    }
  }, [])

  const refreshUserRole = useCallback(async () => {
    if (!user) return

    setError(null)
    try {
      // Fetch updated admin profile from our API
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: user.uid }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const adminData = data.data
        // Successfully refreshed admin profile
        setUser({
          ...user,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          role: adminData.role,
        })
      } else {
        console.error('[Auth] Failed to refresh admin profile:', data.error)
        setError('Failed to refresh user role')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh user role'
      setError(message)
      console.error('[Auth] Refresh role failed:', err)
    }
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut: logout,
        refreshUserRole,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
