# DIMS-SR Admin Portal

A secure, government-grade admin portal for managing SIM registrations with RAFT consensus-based voting on critical changes.

## Overview

This is a **separate Next.js project** that connects to two Firebase databases:

- **Firebase Project A**: Admin authentication and RAFT vote management (dedicated)
- **Firebase Project B**: Read/write access to DIMS-SR SIM registration data (existing)

### Key Features

- ✅ Three-role admin system (NADRA, PTA, Telco) with one account per role
- ✅ SIM registration data viewer with search, filter, and pagination
- ✅ RAFT consensus voting on edit/delete operations (48-hour window)
- ✅ Real-time in-app vote notifications via Firestore listeners
- ✅ Hyperledger Fabric blockchain transaction logs
- ✅ Vote history and audit trail
- ✅ Automatic vote expiration via Vercel Cron Job
- ✅ Server-side only Firebase Admin SDK access (secure)

## Architecture

```
DIMS-SR Admin Portal
├── Firebase Project A (Admin Auth & Voting)
│   ├── adminProfiles (email, role, createdAt)
│   ├── voteRequests (RAFT consensus data)
│   └── notifications (in-app notifications)
│
├── Firebase Project B (DIMS-SR Data - Admin SDK only)
│   └── simRegistrations (read/write operations)
│
└── Hyperledger Fabric
    └── Blockchain transaction logs (read-only)
```

## Setup

### Prerequisites

- Node.js 18+ and pnpm
- Two separate Firebase projects (A for admin, B existing DIMS-SR)
- Vercel account for deployment

### 1. Complete Firebase Configuration

**Status:**
- ✅ Firebase Project A (Admin Portal) - Admin SDK credentials pre-configured
- ✅ Firebase Project B (DIMS-SR) - Admin SDK credentials pre-configured  
- ⚠️ Firebase Project A - Web app config still needs completion

Follow the **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** guide for:
1. Getting the web app API key from Firebase Console
2. Enabling Email/Password authentication
3. Creating required Firestore collections
4. Setting up security rules
5. Testing the configuration

The `.env.local` file already contains the sensitive Admin SDK credentials and is git-ignored.

### 2. Deploy to Vercel

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Deploy
vercel deploy
```

### 3. Vercel Cron Job Configuration

The cron job is already configured in `vercel.json` to run hourly and auto-expire old votes.

## Usage

### Admin Signup

1. Navigate to `/signup`
2. Enter email, password, and select role (NADRA/PTA/Telco)
3. Each role can only have **one account**
4. On success, redirected to dashboard

### Dashboard - View SIM Registrations

- `/dashboard` - Searchable, filterable table of SIM registrations
- Click **Edit** or **Delete** to initiate a vote request
- All changes require 48-hour consensus voting

### Vote on Changes

- `/dashboard/vote` - See pending vote requests from all admins
- Review proposed changes
- Cast **Approve** or **Reject** vote (one vote per admin per request)
- ≥2 approves = executed, ≥2 rejects = rejected

### Vote History

- `/dashboard/history` - Approved, rejected, and expired vote records
- Full audit trail with outcomes

### Blockchain Logs

- `/dashboard/blockchain` - Read-only Hyperledger Fabric transaction log
- Search by transaction ID or CNIC
- Immutable transaction record

## RAFT Consensus Logic

**Vote Majority (Automatic Execution)**
- ✓ ≥2 Approve votes → Operation executed on Firebase Project B
- ✗ ≥2 Reject votes → Operation rejected, no changes made
- ⏱ 48 hours elapsed → Auto-rejected via cron job, all admins notified

**In-App Notifications**
- Real-time updates on the `/dashboard/vote` page
- Bell icon in header shows pending vote count

## Security Notes

- ✅ All Firebase Project B credentials are **server-side only** (environment variables)
- ✅ No client-side access to DIMS-SR data (API routes only)
- ✅ Vote counts calculated server-side (no optimistic UI)
- ✅ Admins cannot change votes once cast
- ✅ In-app notifications only (no external email dependencies)
- ✅ Firestore RLS policies should restrict access by uid/role

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/sim` | GET | Fetch paginated SIM registrations |
| `/api/votes/create` | POST | Create a new vote request |
| `/api/votes/cast` | POST | Cast a vote on request |
| `/api/blockchain` | GET | Fetch blockchain transaction logs |
| `/api/cron/expire-votes` | GET | Auto-expire old votes (hourly) |

## Troubleshooting

**Vote requests not creating?**
- Check Firebase Project A admin SDK credentials in `.env.local`
- Verify Firestore voteRequests collection exists
- Verify Email/Password auth is enabled in Firebase Console

**DIMS-SR data not loading?**
- Verify Firebase Project B collection name is `simRegistrations`
- Check admin SDK credentials for Project B
- Verify service account has Firestore read/write permissions

## Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Type check
pnpm type-check
```

## Deployment Checklist

- [ ] Firebase Project A web config completed (API Key, App ID, etc.)
- [ ] Email/Password authentication enabled in Firebase
- [ ] Firestore collections created (adminProfiles, voteRequests)
- [ ] Admin accounts created in Firebase Project A
- [ ] All environment variables set in Vercel
- [ ] Firestore security rules configured
- [ ] Cron job configured in Vercel
- [ ] DNS/custom domain configured
- [ ] SSL certificate active

## Support

For issues or questions, contact the DIMS-SR development team or open a support ticket.

---

**Built with Next.js 16, Firebase, Tailwind CSS, and Vercel**
