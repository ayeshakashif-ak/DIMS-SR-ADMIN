# DIMS-SR Firestore Collections Schema

## Collection: `sims`
The main SIM registration records collection.

### Fields:
- `uid` (string) - User ID
- `cnic` (string) - CNIC number
- `transactionId` (string) - Transaction ID (TXN-{timestamp}-{random})
- `trackingNumber` (string) - Tracking number (TRK-{timestamp}-{random})
- `networkProvider` (string) - Mobile network (mobileNetwork)
- `mobileNumber` (string) - Phone number (format: 03XXXXXXXXX)
- `paymentMethod` (string) - Payment method
- `deliveryAddress` (string) - Delivery address
- `paymentAddress` (string) - Payment address
- `fingerprintHashes` (array) - SHA256 hashes of fingerprint images
- `fingerprintVerificationStatus` (string) - 'verified' | 'pending'
- `status` (string) - 'processing' | 'active' | 'inactive'
- `registrationDate` (Timestamp) - Registration date
- `activationDate` (Timestamp | null) - Activation date
- `deactivationDate` (Timestamp | null) - Deactivation date
- `createdAt` (Timestamp) - Created timestamp
- `updatedAt` (Timestamp) - Last updated timestamp

## Collection: `users`
User profile data.

### Fields:
- `uid` (string) - User ID
- `cnic` (string) - CNIC number
- `name` (string) - Full name
- `fatherName` (string) - Father's name
- `dateOfBirth` (string) - DOB
- `nadraVerified` (boolean) - NADRA verification status
- `registeredSims` (array) - Array of SIM objects with: simId, mobileNumber, networkProvider, transactionId, trackingNumber, fingerprintVerified, status, registrationDate
- `networkProvider` (string) - Default network provider
- `createdAt` (Timestamp) - Created timestamp
- `updatedAt` (Timestamp) - Last updated timestamp

## Collection: `orders`
Order tracking records.

### Fields:
- `uid` (string) - User ID
- `transactionId` (string) - Transaction ID
- `trackingNumber` (string) - Tracking number
- `simId` (string) - Reference to SIM ID
- `status` (string) - 'confirmed' | 'processing' | 'shipped' | 'in-transit' | 'delivered'
- `orderDate` (Timestamp) - Order date
- `estimatedDelivery` (Timestamp) - Estimated delivery date
- `timeline` (array) - Array of timeline events: { status, timestamp, description }
- `createdAt` (Timestamp) - Created timestamp
