import { NextRequest } from 'next/server'
import { getStackServerApp } from './stack'
import { query } from './database'
import { SignJWT, jwtVerify } from 'jose'
import { encodedKey } from './auth-constants'

export interface SecureUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'provider' | 'student'
  phone?: string
  studentNumber?: string
  institution?: string
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  university?: 'UFS' | 'CUT'
  yearOfStudy?: number
  course?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  profileImageUrl?: string
  profileImageCloudinaryId?: string
}

export interface SecureSession {
  user: SecureUser
  sessionId: string
  expiresAt: Date
  iat: number
}

// Create secure JWT session token
export async function createSecureSession(user: SecureUser): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const token = await new SignJWT({
    userId: user.id,
    sessionId,
    role: user.role,
    email: user.email,
    emailVerified: user.emailVerified,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)

  // Store session in database for validation
  await query`
    INSERT INTO user_sessions (id, user_id, expires_at, created_at)
    VALUES (${sessionId}, ${user.id}, ${expiresAt.toISOString()}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
  `

  return token
}

// Verify and validate JWT session token
export async function verifySecureSession(token: string): Promise<SecureSession | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256']
    })

    const { userId, sessionId, role, email, exp } = payload

    if (!userId || !sessionId || !role || !email || !exp) {
      return null
    }

    // Check if session exists and is valid in database
    const sessionResult = await query`
      SELECT s.id, s.user_id, s.expires_at, s.created_at,
             u.email, u.first_name, u.last_name, u.role, u.phone, u.student_number, u.institution,
             u.is_active, u.email_verified, u.created_at as user_created_at, u.updated_at,
             st.university, st.year_of_study, st.course, st.emergency_contact_name, st.emergency_contact_phone
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN students st ON u.id = st.user_id
      WHERE s.id = ${sessionId} AND s.user_id = ${userId} AND s.expires_at > NOW()
    `

    if (sessionResult.rows.length === 0) {
      return null
    }

    const sessionData = sessionResult.rows[0]

  return {
      user: {
        id: sessionData.user_id,
        email: sessionData.email,
        firstName: sessionData.first_name,
        lastName: sessionData.last_name,
        role: sessionData.role,
        phone: sessionData.phone,
        studentNumber: sessionData.student_number,
        institution: sessionData.institution,
        isActive: sessionData.is_active,
        emailVerified: sessionData.email_verified,
        createdAt: new Date(sessionData.user_created_at),
        updatedAt: new Date(sessionData.updated_at),
        university: sessionData.university,
        yearOfStudy: sessionData.year_of_study,
        course: sessionData.course,
        emergencyContactName: sessionData.emergency_contact_name,
        emergencyContactPhone: sessionData.emergency_contact_phone,
      },
      sessionId: String(sessionId),
      expiresAt: new Date(sessionData.expires_at),
      iat: Math.floor(new Date(sessionData.created_at).getTime() / 1000)
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// Get current user from request headers
export async function getCurrentUserFromRequest(request: NextRequest): Promise<SecureUser | null> {
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('varsity-nest-session')?.value

  let token = null

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else if (cookieToken) {
    token = cookieToken
  }

  if (!token) {
    return null
  }

  const session = await verifySecureSession(token)
  return session?.user || null
}

// Get current user from StackAuth (fallback for OAuth)
export async function getCurrentUserFromStackAuth(): Promise<SecureUser | null> {
  try {
    const app = getStackServerApp()
    const stackUser = await app.getUser({ or: 'return-null' })
    
    if (!stackUser?.id) {
      return null
    }

    // Get user data from database
    const userResult = await query`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.student_number, u.institution, 
             u.is_active, u.email_verified, u.created_at, u.updated_at, u.profile_image_url, u.profile_image_cloudinary_id,
             s.university, s.year_of_study, s.course, s.emergency_contact_name, s.emergency_contact_phone
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.id = ${stackUser.id}
    `
    
    if (userResult.rows.length === 0) {
      return null
    }
    
    const user = userResult.rows[0]
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      phone: user.phone,
      studentNumber: user.student_number,
      institution: user.institution,
      isActive: user.is_active,
      emailVerified: user.email_verified,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
      university: user.university,
      yearOfStudy: user.year_of_study,
      course: user.course,
      emergencyContactName: user.emergency_contact_name,
      emergencyContactPhone: user.emergency_contact_phone,
      profileImageUrl: user.profile_image_url,
      profileImageCloudinaryId: user.profile_image_cloudinary_id,
    }
  } catch (error) {
    console.error('StackAuth user fetch failed:', error)
    return null
  }
}

// Invalidate session (logout)
export async function invalidateSession(sessionId: string): Promise<void> {
  await query`
    DELETE FROM user_sessions 
    WHERE id = ${sessionId}
  `
}

// Invalidate all sessions for a user
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await query`
    DELETE FROM user_sessions 
    WHERE user_id = ${userId}
  `
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  await query`
    DELETE FROM user_sessions 
    WHERE expires_at < NOW()
  `
}

// Role validation helper
export function hasRequiredRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'student': 1,
    'provider': 2,
    'admin': 3
  }
  
  return (roleHierarchy[userRole as keyof typeof roleHierarchy] || 0) >= 
         (roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0)
}

// Middleware for API route protection
export function createAuthMiddleware(requiredRole?: string) {
  return async (request: NextRequest) => {
    const user = await getCurrentUserFromRequest(request)
    
    if (!user) {
      return { error: 'Unauthorized', status: 401 }
    }
    
    if (!user.isActive) {
      return { error: 'Account deactivated', status: 403 }
    }
    
    if (!user.emailVerified) {
      return { error: 'Email not verified', status: 403 }
    }
    
    if (requiredRole && !hasRequiredRole(user.role, requiredRole)) {
      return { error: 'Insufficient permissions', status: 403 }
    }
    
    return { user, error: null, status: 200 }
  }
}
