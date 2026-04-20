// Firebase Project B - DIMS-SR Data (Server-side only via Admin SDK)
// This file should ONLY be imported in server-side code (API Routes, Server Actions)
// Credentials are never exposed to the client

import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { Auth, getAuth } from 'firebase-admin/auth'

let appB: any = null

// Lazy initialization - only initialize when actually needed
export function getFirestoreB(): Firestore {
  const projectId = process.env.FIREBASE_B_PROJECT_ID
  const clientEmail = process.env.FIREBASE_B_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_B_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Project B Admin SDK credentials')
  }

  // Handle private key formatting - just replace escaped newlines if any
  privateKey = privateKey.replace(/\\n/g, '\n')

  // Check if already initialized
  const existingApps = getApps()
  const existing = existingApps.find((app) => app.name === 'DIMS-SR')

  if (existing) {
    return getFirestore(existing)
  }

  // Initialize fresh
  appB = initializeApp(
    {
      credential: cert({
        projectId,
        clientEmail,
        privateKeyId: process.env.FIREBASE_B_PRIVATE_KEY_ID,
        privateKey,
      } as ServiceAccount),
      projectId,
    },
    'DIMS-SR'
  )

  return getFirestore(appB)
}

export function getAuthB(): Auth {
  const projectId = process.env.FIREBASE_B_PROJECT_ID
  const clientEmail = process.env.FIREBASE_B_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_B_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Project B Admin SDK credentials')
  }

  // Check if already initialized
  const existingApps = getApps()
  const existing = existingApps.find((app) => app.name === 'DIMS-SR')

  if (existing) {
    return getAuth(existing)
  }

  // Initialize fresh (should already be done by getFirestoreB)
  appB = initializeApp(
    {
      credential: cert({
        projectId,
        clientEmail,
        privateKeyId: process.env.FIREBASE_B_PRIVATE_KEY_ID,
        privateKey,
      } as ServiceAccount),
      projectId,
    },
    'DIMS-SR'
  )

  return getAuth(appB)
}

// For backwards compatibility - these will throw if called
export const firestoreB = {} as any
export const authB = {} as any
