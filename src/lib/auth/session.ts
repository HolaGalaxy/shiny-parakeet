import { SignJWT, jwtVerify } from 'jose'
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SEC, AUTH_SECRET_MIN_LENGTH } from '@/constants/auth'
import { ERROR_MSG } from '@/constants/errors'
import type { SessionUser } from '@/types/auth'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET
  if (!raw || raw.length < AUTH_SECRET_MIN_LENGTH) {
    throw new Error(ERROR_MSG.AUTH_SECRET_MISSING)
  }
  return new TextEncoder().encode(raw)
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role,
    profilePicture: user.profilePicture,
    sessionVersion: user.sessionVersion,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(getSecret())
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    const user = payload as unknown as SessionUser
    if (!user.id || !user.email) return null
    return user
  } catch {
    return null
  }
}

export async function getSessionFromCookie(
  cookie: ReadonlyRequestCookies,
): Promise<SessionUser | null> {
  const token = cookie.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export function sessionCookieOptions(): {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax'
  path: string
  maxAge: number
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  }
}
