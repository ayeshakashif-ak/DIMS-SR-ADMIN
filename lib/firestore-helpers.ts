// Firestore helper functions - Re-exports from firebase-admin
// These are just pass-throughs to ensure consistent imports across API routes

export {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase-admin/firestore'
