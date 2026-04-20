import { getFirestoreA } from '../../../lib/firebase-a-admin'
import { getAuth } from 'firebase-admin/auth'
import { getApps } from 'firebase-admin/app'

export async function GET() {
  try {
    const db = getFirestoreA()
    const apps = getApps()
    const adminApp = apps.find(app => app.name === 'ADMIN_PORTAL')
    if (!adminApp) {
      throw new Error('Admin app not found')
    }
    const auth = getAuth(adminApp)

    // Create a test admin user
    const userRecord = await auth.createUser({
      email: 'admin@test.com',
      password: 'test123456',
      displayName: 'Test Admin',
    })

    // Create admin profile in Firestore
    await db.collection('adminProfiles').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: 'admin@test.com',
      role: 'NADRA',
      createdAt: new Date(),
    })

    return Response.json({
      success: true,
      userId: userRecord.uid,
      message: 'Test admin user created successfully'
    })
  } catch (error) {
    console.error('Error creating test user:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}