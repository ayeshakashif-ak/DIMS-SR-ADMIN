# DIMS-SR Admin Portal - Quick Start Guide

## 5-Minute Setup

### Step 1: Clone & Install
```bash
# Clone this repository (if not already done)
git clone <your-repo>
cd dims-sr-admin-portal

# Install dependencies
pnpm install
```

### Step 2: Create Firebase Projects

#### Firebase Project A (Admin Auth)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project named "DIMS-SR Admin"
3. Enable Email/Password authentication
4. Create Firestore database (US region)
5. Go to **Project Settings** → **Service Accounts** → **Generate New Private Key**
6. Copy the credentials

#### Firebase Project B (Already exists - DIMS-SR)
- Get the service account JSON from existing DIMS-SR project settings

### Step 3: Configure Environment Variables

Create `.env.local` file in the root:

```bash
# Firebase Project A - Client
NEXT_PUBLIC_FIREBASE_A_API_KEY=<from Project A console>
NEXT_PUBLIC_FIREBASE_A_AUTH_DOMAIN=<project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_A_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_A_STORAGE_BUCKET=<project-id>.appspot.com
NEXT_PUBLIC_FIREBASE_A_MESSAGING_SENDER_ID=<from console>
NEXT_PUBLIC_FIREBASE_A_APP_ID=<from console>

# Firebase Project A - Server (from downloaded JSON key)
FIREBASE_A_CLIENT_EMAIL=firebase-adminsdk-xxx@project-id.iam.gserviceaccount.com
FIREBASE_A_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_A_PRIVATE_KEY_ID=<from JSON key>

# Firebase Project B - Server (existing DIMS-SR)
FIREBASE_B_PROJECT_ID=<existing-project-id>
FIREBASE_B_CLIENT_EMAIL=firebase-adminsdk-xxx@existing-project.iam.gserviceaccount.com
FIREBASE_B_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_B_PRIVATE_KEY_ID=<from JSON key>

# Optional
HYPERLEDGER_API_URL=https://your-fabric-api.com
HYPERLEDGER_API_KEY=your-key
CRON_SECRET=your-random-secret-key
```

### Step 4: Setup Firebase Project A Collections

Go to Firebase Project A → Firestore → Create Collections:

**Collection 1: `adminProfiles`**
```
Add first document with ID "test-nadra":
{
  uid: "test-nadra",
  email: "nadra@example.com",
  role: "NADRA",
  createdAt: (timestamp)
}
```

**Collection 2: `voteRequests`** (empty for now)

### Step 5: Run Locally

```bash
# Start development server
pnpm dev

# Open http://localhost:3000 in browser
```

### Step 6: Test Login

1. Navigate to `/signup`
2. Create account:
   - Email: `nadra@example.com`
   - Password: `testpass123`
   - Role: NADRA
3. Click Sign Up → redirects to `/dashboard`

### Step 7: Add Test Data (Firebase Project B)

In Firebase Project B Firestore, add to `simRegistrations`:
```
{
  cnic: "1234-5678-9012-3",
  phoneNumber: "03001234567",
  simStatus: "pending",
  simSerialNumber: "SIM12345678",
  operator: "Jazz",
  registrationDate: (timestamp),
  userId: "test-user-1"
}
```

### Step 8: Test Edit/Delete

1. Go to `/dashboard`
2. See the test SIM record in the table
3. Click **Edit** or **Delete**
4. Fill in details and confirm
5. Check `/dashboard/vote` to see the pending request

---

## Common Issues & Fixes

**"Invalid API Key" Error**
- Verify `.env.local` has correct Firebase keys
- Check that Project A has Email/Password auth enabled
- Ensure Firestore database is created

**"Missing Firebase credentials" on Build**
- This is normal - add `.env.local` before deploying
- Dev server will work with env vars

**Cannot create second admin account**
- Each role can only have ONE account
- Error message: "A [ROLE] account already exists"
- Delete the test account first or use different role

**404 on routes like `/dashboard`**
- Server must be running (`pnpm dev`)
- Check console for any errors

---

## File Structure Overview

```
. (root)
├── app/                          # Next.js App Router
│   ├── login/                    # /login page
│   ├── signup/                   # /signup page
│   ├── dashboard/                # /dashboard pages
│   ├── api/                      # API routes
│   └── layout.tsx                # Root layout with auth
├── lib/                          # Utilities & Firebase
│   ├── firebase-a.ts             # Firebase Project A client
│   ├── firebase-a-admin.ts       # Firebase Project A server
│   ├── firebase-b-admin.ts       # Firebase Project B server
│   ├── auth-context.tsx          # Auth state management
│   └── types.ts                  # TypeScript types
├── components/                   # React components
├── .env.local                    # Environment variables (CREATE THIS)
├── .env.local.example            # Example env variables
├── README.md                     # Full documentation
└── vercel.json                   # Vercel cron config
```

---

## Next Steps

### Local Development
- Implement real Hyperledger API endpoint
- Test all voting scenarios

### Deployment to Vercel
1. Connect Git repository
2. Add environment variables to Vercel project
3. Deploy branch
4. Configure custom domain
5. Set up Vercel cron job

### Production Checklist
- [ ] Test with multiple admin accounts
- [ ] Test vote consensus logic
- [ ] Verify blockchain logs (if using real Hyperledger)
- [ ] Set up monitoring & error tracking
- [ ] Configure backup & disaster recovery

---

## Key Features Overview

### Authentication
- Email/password signup and login
- Role-based access (NADRA, PTA, Telco)
- One account per role

### SIM Management
- View all SIM registrations
- Search and filter records
- Edit and delete with voting

### RAFT Voting
- 48-hour voting window
- Majority consensus (2/3 votes)
- Real-time in-app vote notifications

### Blockchain
- Read-only Hyperledger logs
- Transaction search
- Immutable record keeping

### Admin Tools
- Vote history with audit trail
- Real-time notifications
- Auto-expiring votes

---

## Support

For issues or questions:
1. Check `.env.local` configuration
2. Review README.md for detailed docs
3. Check console for error messages
4. Verify Firebase project settings

---

**Ready to start? Run `pnpm dev` and navigate to `http://localhost:3000`**
