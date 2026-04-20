# Firebase Setup Guide

This document explains how to complete the Firebase configuration for the DIMS-SR Admin Portal.

## Current Status

✅ **Firebase Project A (Admin Portal)** - Partially Configured
- Project ID: `login-dims-aedb1`
- Admin SDK credentials: ✅ Configured in `.env.local`
- Web app config: ⚠️ **NEEDS CONFIGURATION**

✅ **Firebase Project B (DIMS-SR)** - Fully Configured
- Project ID: `dims-sr`
- Admin SDK credentials: ✅ Configured in `.env.local`
- Collections: Uses existing DIMS-SR data structure

## Step 1: Complete Firebase Project A Web Config

You need to get the web app configuration from Firebase Console to complete the client-side setup.

### Instructions:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project **`login-dims-aedb1`**
3. Click the gear icon ⚙️ (Settings) in the top-left
4. Select **"Project Settings"**
5. Scroll down to **"Your apps"** section
6. Click on the **Web app** (or create one if missing)
7. You'll see a config object like:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "login-dims-aedb1.firebaseapp.com",
  projectId: "login-dims-aedb1",
  storageBucket: "login-dims-aedb1.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### Update .env.local:

Replace the `TODO` values in `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_A_API_KEY=AIza...          # Copy from apiKey
NEXT_PUBLIC_FIREBASE_A_MESSAGING_SENDER_ID=123456789012  # From messagingSenderId
NEXT_PUBLIC_FIREBASE_A_APP_ID=1:123456789012:web:abcdef  # From appId
```

## Step 2: Enable Firebase Authentication (Project A)

1. In Firebase Console, go to **Authentication**
2. Click **"Get Started"**
3. Click **"Email/Password"** provider
4. Toggle **"Enable"**
5. Click **Save**

## Step 3: Create Firestore Collections (Project A)

The system needs two collections in Firebase Project A:

### Collection 1: `adminProfiles`

Create collection with example documents:

```json
{
  "uid": "admin_uid_1",
  "email": "nadra@example.com",
  "role": "NADRA",
  "createdAt": "timestamp"
}
```

Structure:
- **Collection**: `adminProfiles`
- **Documents**: One per admin account
- **Fields**:
  - `uid` (string) - User's Firebase Auth UID
  - `email` (string) - Admin email
  - `role` (string) - One of: "NADRA", "PTA", or "Telco"
  - `createdAt` (timestamp) - Account creation time

### Collection 2: `voteRequests`

Created automatically when first vote is initiated. Structure:

- **Collection**: `voteRequests`
- **Fields**:
  - `requestId` (string)
  - `operationType` (string) - "edit" or "delete"
  - `targetCollection` (string) - "simRegistrations"
  - `targetDocumentId` (string)
  - `proposedChanges` (object or null)
  - `originalData` (object)
  - `initiatedBy` (object)
  - `status` (string) - "pending", "approved", or "rejected"
  - `votes` (object) - NADRA, PTA, Telco vote values
  - `createdAt` (timestamp)
  - `expiresAt` (timestamp)
  - `resolvedAt` (timestamp or null)
  - `resolvedOutcome` (string or null)

### Collection 3: `notifications`

Created automatically when needed. Simple structure for tracking notifications.

## Step 4: Configure Firestore Security Rules (Optional but Recommended)

Add these rules to Project A's Firestore for security:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // More restrictive: Only admins with specific roles
    match /adminProfiles/{doc} {
      allow read: if request.auth != null;
      allow write: if false; // Server-side only
    }

    match /voteRequests/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 5: Test the Setup

1. Start the dev server:
   ```bash
   pnpm dev
   ```

2. Open http://localhost:3000
   
3. Click **"Sign Up"**

4. Create an admin account:
   - Email: `nadra@test.com`
   - Password: `TestPassword123!`
   - Role: **NADRA**

5. You should be redirected to dashboard

## Step 6: Verify Firebase Project B (DIMS-SR)

The admin portal already has access to the DIMS-SR Firebase Project B:
- Project ID: `dims-sr`
- Collections used: `simRegistrations` (and related collections)

✅ This is pre-configured in `.env.local`

## Troubleshooting

**"Missing Firebase configuration" error:**
- Ensure all `NEXT_PUBLIC_FIREBASE_A_*` values are filled in `.env.local`
- Restart the dev server after updating `.env.local`

**Cannot create admin account:**
- Verify Email/Password authentication is enabled in Firebase Console
- Check browser console for specific error messages

**Cannot see SIM data on dashboard:**
- Verify Firebase Project B credentials are correct
- Check that `simRegistrations` collection exists in Project B
- Verify admin SDK has appropriate Firestore permissions

**Cron job not running:**
- Deploy to Vercel (required for cron to work)
- Add `CRON_SECRET` to Vercel environment variables
- Verify route handler is responding to GET `/api/cron/expire-votes`

## Environment Variables Summary

```bash
# Project A - Web Config
NEXT_PUBLIC_FIREBASE_A_API_KEY              # From Firebase Console
NEXT_PUBLIC_FIREBASE_A_AUTH_DOMAIN          # login-dims-aedb1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_A_PROJECT_ID           # login-dims-aedb1
NEXT_PUBLIC_FIREBASE_A_STORAGE_BUCKET       # login-dims-aedb1.appspot.com
NEXT_PUBLIC_FIREBASE_A_MESSAGING_SENDER_ID  # From Firebase Console
NEXT_PUBLIC_FIREBASE_A_APP_ID               # From Firebase Console

# Project A - Admin SDK (Server-side)
FIREBASE_A_CLIENT_EMAIL                     # ✅ Already configured
FIREBASE_A_PRIVATE_KEY                      # ✅ Already configured
FIREBASE_A_PRIVATE_KEY_ID                   # ✅ Already configured

# Project B - Admin SDK (Server-side)
FIREBASE_B_PROJECT_ID                       # ✅ Already configured (dims-sr)
FIREBASE_B_CLIENT_EMAIL                     # ✅ Already configured
FIREBASE_B_PRIVATE_KEY                      # ✅ Already configured
FIREBASE_B_PRIVATE_KEY_ID                   # ✅ Already configured

# Other
HYPERLEDGER_API_URL                         # Optional - for blockchain logs
CRON_SECRET                                 # Change to secure random value
```

## Next Steps

1. ✅ Complete the Firebase Project A web config
2. ✅ Enable Email/Password authentication
3. ✅ Create `adminProfiles` collection with sample documents
4. ✅ Start dev server and test signup
5. ✅ Deploy to Vercel when ready
6. Deploy and test the full voting workflow
