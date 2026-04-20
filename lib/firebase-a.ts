// Firebase Project A - Admin Portal Authentication & Voting
// This file initializes Firebase for client-side auth and Firestore operations
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfigA = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_A_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_A_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_A_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_A_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_A_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_A_APP_ID!,
}

// Initialize Firebase A (only if not already initialized)
const appA = getApps().length === 0 ? initializeApp(firebaseConfigA) : getApps()[0]

export const authA: Auth = getAuth(appA)
export const firestoreA: Firestore = getFirestore(appA)
