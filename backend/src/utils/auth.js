// Password hashing (scrypt) + HMAC-signed session tokens.
// No external dependencies — uses Node's built-in `crypto` only.
//
// Why scrypt: memory-hard, comparable to bcrypt for password storage.
// Why custom tokens: a tiny base64url(payload).base64url(hmac) format —
// like JWT minus the unnecessary header — keeps us off the `jsonwebtoken`
// library while staying just as verifiable. The HMAC secret comes from
// AUTH_SECRET in the environment.

import { randomBytes, scrypt, timingSafeEqual, createHmac } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

const KEYLEN = 64
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000   // 7 days
const SECRET = process.env.AUTH_SECRET || 'absolute-concepts-dev-secret-change-me'

if (SECRET === 'absolute-concepts-dev-secret-change-me') {
  // eslint-disable-next-line no-console
  console.warn('[auth] Using DEFAULT AUTH_SECRET — set AUTH_SECRET in backend/.env for production.')
}

/* ------------------ Password hashing ------------------ */

export async function hashPassword(password) {
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }
  const salt = randomBytes(16).toString('hex')
  const hash = (await scryptAsync(password, salt, KEYLEN)).toString('hex')
  return `${salt}:${hash}`
}

export async function verifyPassword(password, stored) {
  if (!password || !stored || typeof stored !== 'string') return false
  const [salt, hashHex] = stored.split(':')
  if (!salt || !hashHex) return false
  const computed = await scryptAsync(password, salt, KEYLEN)
  const stored_buf = Buffer.from(hashHex, 'hex')
  if (computed.length !== stored_buf.length) return false
  return timingSafeEqual(computed, stored_buf)
}

/* ------------------ Tokens ------------------ */

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function fromB64url(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4))
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

export function signToken(payload) {
  const data = { ...payload, exp: Date.now() + TOKEN_TTL_MS }
  const body = b64url(JSON.stringify(data))
  const sig  = b64url(createHmac('sha256', SECRET).update(body).digest())
  return `${body}.${sig}`
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null

  const expected = b64url(createHmac('sha256', SECRET).update(body).digest())
  // Length-constant compare on the strings
  if (expected.length !== sig.length) return null
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  if (mismatch !== 0) return null

  let payload
  try { payload = JSON.parse(fromB64url(body).toString('utf8')) }
  catch { return null }

  if (!payload?.exp || payload.exp < Date.now()) return null
  return payload
}
