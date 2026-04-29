import { SESSION_COOKIE_NAME } from '@/constants/auth'
import { sessionCookieOptions } from '@/lib/auth/session'
import { jsonOk } from '@/lib/http/http-error'

export async function POST() {
  const res = jsonOk({ ok: true })
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    ...sessionCookieOptions(),
    maxAge: 0,
  })
  return res
}
