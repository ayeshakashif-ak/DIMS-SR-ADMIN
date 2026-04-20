// Types for DIMS-SR Admin Portal
import { Timestamp } from 'firebase/firestore'

// Admin Portal Types
export type AdminRole = 'NADRA' | 'PTA' | 'TELCO'

export interface AdminProfile {
  uid: string
  firstName: string
  lastName: string
  email: string
  role: AdminRole
  createdAt: Timestamp
}

// Proposal System Types
export type ProposalActionType = 'approve_sim' | 'block_sim' | 'change_operator'

export interface ProposalVotes {
  NADRA: 'approve' | 'reject' | null
  PTA: 'approve' | 'reject' | null
  TELCO: 'approve' | 'reject' | null
}

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'executed'

export interface Proposal {
  id: string
  actionType: ProposalActionType
  targetSimId: string
  requestedBy: {
    uid: string
    role: AdminRole
  }
  newValue?: string // e.g., operator name or status
  currentValue?: string // current operator or status
  description: string
  votes: ProposalVotes
  status: ProposalStatus
  createdAt: Timestamp
  approvedAt?: Timestamp
  executedAt?: Timestamp
}

// Vote Request Types
export type OperationType = 'edit' | 'delete'
export type VoteStatus = 'pending' | 'approved' | 'rejected'

export interface VoteRecord {
  NADRA: 'approve' | 'reject' | null
  PTA: 'approve' | 'reject' | null
  Telco: 'approve' | 'reject' | null
}

export interface VoteRequest {
  requestId: string
  operationType: OperationType
  targetCollection: string
  targetDocumentId: string
  proposedChanges: Record<string, any> | null // null for deletes
  originalData: Record<string, any>
  initiatedBy: {
    uid: string
    role: AdminRole
  }
  status: VoteStatus
  votes: VoteRecord
  createdAt: Timestamp
  expiresAt: Timestamp
  resolvedAt: Timestamp | null
  resolvedOutcome: string | null
}

// Notification Types
export interface Notification {
  id: string
  adminUid: string
  type: 'vote-created' | 'vote-approved' | 'vote-rejected' | 'vote-expired'
  voteRequestId: string
  title: string
  message: string
  read: boolean
  createdAt: Timestamp
  relatedAdminRole?: AdminRole
}

// SIM Registration Types (from DIMS-SR)
export interface SimRegistration {
  id: string
  userId: string
  cnic: string
  phoneNumber: string
  simStatus: string
  registrationDate: Timestamp
  operator: string
  simSerialNumber: string
  orderStatus: string
  nadraStatus?: string
  ptaStatus?: string
  biometricStatus?: string
  [key: string]: any // Allow additional fields
}

// Blockchain Transaction Types
export interface BlockchainTransaction {
  transactionId: string
  blockNumber: number
  timestamp: Timestamp | string
  operationType: string
  initiator: string
  affectedRecord: {
    collection: string
    documentId: string
  }
  status: 'success' | 'failed' | 'pending'
  details?: Record<string, any>
}

// Session/Context Types
export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signUp: (email: string, password: string, role: AdminRole) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUserRole: () => Promise<void>
  error: string | null
}

export interface AuthUser {
  uid: string
  email: string
  firstName?: string
  lastName?: string
  role: AdminRole
}
