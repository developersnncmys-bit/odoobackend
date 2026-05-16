// Auth — first-time setup, login, current user.
//
// Design intent (per the user brief): no usernames are seeded on install.
// The very first visit to the login screen calls /api/auth/status which
// reports `requiresSetup: true` when the User collection is empty. The UI
// then exposes the "Create first admin" form which calls /api/auth/setup
// (open only while the DB has zero users). Subsequent visits hit /login.

import { User } from '../models/index.js'
import { HttpError } from '../middleware/async-handler.js'
import { nextId } from '../utils/ids.js'
import { hashPassword, verifyPassword, signToken } from '../utils/auth.js'

const today = () => new Date().toISOString().slice(0, 10)

/** GET /api/auth/status — public; tells the UI whether setup is needed. */
export async function status(_req, res) {
  const userCount = await User.estimatedDocumentCount()
  res.json({
    initialized:   userCount > 0,
    requiresSetup: userCount === 0,
    userCount,
  })
}

/**
 * POST /api/auth/setup — public, ONLY while User collection is empty.
 * Creates the first Admin account. Returns { user, token } so the UI can
 * sign the admin in immediately.
 */
export async function setup(req, res) {
  const userCount = await User.estimatedDocumentCount()
  if (userCount > 0) {
    throw new HttpError(409, 'Setup already complete — the system already has at least one user. Sign in instead.')
  }

  const { username, email, name, password } = req.body || {}
  validateCreatePayload({ username, email, name, password })

  const id = await nextId('users')
  const user = await User.create({
    _id: id,
    username: String(username).toLowerCase().trim(),
    email:    String(email).toLowerCase().trim(),
    name:     String(name).trim(),
    role:     'Admin',                              // first user is always Admin
    passwordHash: await hashPassword(password),
    lastLoginAt:  today(),
  })

  const token = signToken({ sub: user._id, role: user.role })
  res.status(201).json({ user: user.toJSON(), token })
}

/** POST /api/auth/login — public. */
export async function login(req, res) {
  const { username, password } = req.body || {}
  if (!username || !password) throw new HttpError(400, 'username and password are required')

  const user = await User.findOne({ username: String(username).toLowerCase().trim() }).select('+passwordHash')
  if (!user)                throw new HttpError(401, 'Invalid username or password')
  if (user.active === false) throw new HttpError(401, 'Account is inactive')

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw new HttpError(401, 'Invalid username or password')

  user.lastLoginAt = today()
  await user.save()

  const token = signToken({ sub: user._id, role: user.role })
  res.json({ user: user.toJSON(), token })
}

/** GET /api/auth/me — requires bearer token. */
export async function me(req, res) {
  res.json({ user: req.user })
}

/** POST /api/auth/logout — stateless server, so this is a no-op. */
export async function logout(_req, res) {
  res.status(204).end()
}

/* ----------- shared payload validation ----------- */

function validateCreatePayload({ username, email, name, password }) {
  const errs = []
  if (!username || !/^[a-z0-9._-]{3,32}$/i.test(username)) {
    errs.push('username must be 3-32 chars (letters, digits, ._-)')
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errs.push('valid email is required')
  if (!name || !String(name).trim())           errs.push('name is required')
  if (!password || String(password).length < 6) errs.push('password must be at least 6 characters')
  if (errs.length) throw new HttpError(400, 'Invalid payload', { errors: errs })
}

export { validateCreatePayload }
