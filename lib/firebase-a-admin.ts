// Firebase Project A - Admin Portal (Server-side Admin SDK)
// For server-side operations on Firebase Project A

import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let appA: any = null

// Lazy initialization - only initialize when actually needed
export function getAuthA(): Auth {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_A_PROJECT_ID
  const clientEmail = process.env.FIREBASE_A_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_A_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Project A Admin SDK credentials')
  }

  // Check if already initialized
  const existingApps = getApps()
  const existing = existingApps.find((app) => app.name === 'ADMIN_PORTAL')

  if (existing) {
    return getAuth(existing)
  }

  // Initialize fresh
  appA = initializeApp(
    {
      credential: cert({
        projectId,
        clientEmail,
        privateKeyId: process.env.FIREBASE_A_PRIVATE_KEY_ID,
        privateKey,
      } as ServiceAccount),
      projectId,
    },
    'ADMIN_PORTAL'
  )

  return getAuth(appA)
}

export function getFirestoreA(): Firestore {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_A_PROJECT_ID
  const clientEmail = process.env.FIREBASE_A_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_A_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Project A Admin SDK credentials')
  }

  // Check if already initialized
  const existingApps = getApps()
  const existing = existingApps.find((app) => app.name === 'ADMIN_PORTAL')

  if (existing) {
    return getFirestore(existing)
  }

  // Initialize fresh
  appA = initializeApp(
    {
      credential: cert({
        projectId,
        clientEmail,
        privateKeyId: process.env.FIREBASE_A_PRIVATE_KEY_ID,
        privateKey,
      } as ServiceAccount),
      projectId,
    },
    'ADMIN_PORTAL'
  )

  return getFirestore(appA)
}

// For backwards compatibility
export const firestoreA = {} as any
