// User account management (Admin-only for create/update/delete).
// Listing is allowed to any authenticated user so dropdowns can show colleagues.
//
// "Don't store any usernames on install" — see authController.js. All users
// here are created either via /api/auth/setup (first admin) or through
// /api/users by an existing Admin.

import { User } from '../models/index.js'
import { HttpError } from '../middleware/async-handler.js'
import { nextId } from '../utils/ids.js'
import { hashPassword } from '../utils/auth.js'
import { ROLES } from '../utils/constants.js'
import { validateCreatePayload } from './authController.js'

const today = () => new Date().toISOString().slice(0, 10)

export async function list(_req, res) {
  const users = await User.find().sort({ _id: 1 }).lean()
  res.json(users.map(u => ({ ...u, id: u._id, _id: undefined, passwordHash: undefined })))
}

export async function get(req, res) {
  const u = await User.findById(req.params.id)
  if (!u) throw new HttpError(404, 'User not found')
  res.json(u.toJSON())
}

export async function create(req, res) {
  const { username, email, name, password, role, teamMemberId } = req.body || {}
  validateCreatePayload({ username, email, name, password })

  if (role && !ROLES.includes(role)) {
    throw new HttpError(400, `role must be one of: ${ROLES.join(', ')}`)
  }

  const lcUsername = String(username).toLowerCase().trim()
  const existing = await User.findOne({ username: lcUsername }).lean()
  if (existing) throw new HttpError(409, 'Username already taken')

  const id = await nextId('users')
  const user = await User.create({
    _id: id,
    username:     lcUsername,
    email:        String(email).toLowerCase().trim(),
    name:         String(name).trim(),
    role:         role || 'Business Development',
    teamMemberId: teamMemberId || null,
    passwordHash: await hashPassword(password),
    createdAt:    today(),
  })

  res.status(201).json(user.toJSON())
}

export async function update(req, res) {
  const updates = { ...req.body }

  // never accept raw passwordHash from the wire
  delete updates.passwordHash

  // re-hash if a new password was provided
  if (updates.password) {
    updates.passwordHash = await hashPassword(updates.password)
    delete updates.password
  }

  if (updates.role && !ROLES.includes(updates.role)) {
    throw new HttpError(400, `role must be one of: ${ROLES.join(', ')}`)
  }
  if (updates.username) {
    updates.username = String(updates.username).toLowerCase().trim()
  }

  const u = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
  if (!u) throw new HttpError(404, 'User not found')
  res.json(u.toJSON())
}

export async function remove(req, res) {
  // safety net: don't let an admin delete themselves
  if (req.user && req.user.id === req.params.id) {
    throw new HttpError(400, 'You cannot delete your own account while signed in.')
  }
  // safety net: don't drop the last admin
  const target = await User.findById(req.params.id)
  if (!target) throw new HttpError(404, 'User not found')
  if (target.role === 'Admin') {
    const adminCount = await User.countDocuments({ role: 'Admin' })
    if (adminCount <= 1) throw new HttpError(400, 'Cannot remove the last Admin user.')
  }

  await User.findByIdAndDelete(req.params.id)
  res.status(204).end()
}
