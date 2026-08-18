import { cookies } from 'next/headers'

const COOKIE_NAME = 'dls_admin_session'
const MAX_AGE_SECONDS = 8 * 60 * 60

function toBase64Url(bytes: ArrayBuffer) {
  return Buffer.from(bytes).toString('base64url')
}

async function sign(payload: string) {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not configured')
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return toBase64Url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))
}

export async function createAdminSession() {
  const payload = `${Date.now()}`
  return `${payload}.${await sign(payload)}`
}

export async function isAdminSessionValid(value?: string) {
  if (!value) return false
  const [timestamp, signature] = value.split('.')
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return false
  const age = Date.now() - Number(timestamp)
  if (age < 0 || age > MAX_AGE_SECONDS * 1000) return false
  try {
    return (await sign(timestamp)) === signature
  } catch {
    return false
  }
}

export async function hasAdminSession() {
  return isAdminSessionValid((await cookies()).get(COOKIE_NAME)?.value)
}

export { COOKIE_NAME, MAX_AGE_SECONDS }