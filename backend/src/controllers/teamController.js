// Team — doc §11 (departments) + §12 (RBAC stubs).
import { TeamMember } from '../models/index.js'
import { HttpError } from '../middleware/async-handler.js'
import { ROLES } from '../utils/constants.js'

const toApi = (doc) => { const { _id, ...rest } = doc; return { id: _id, ...rest } }

function makeUserId(maxN) { return `u${maxN + 1}` }

export async function list(req, res) {
  const { role } = req.query
  const filter = role ? { role } : {}
  const team = await TeamMember.find(filter).sort({ _id: 1 }).lean()
  res.json(team.map(toApi))
}

export async function get(req, res) {
  const u = await TeamMember.findById(req.params.id)
  if (!u) throw new HttpError(404, 'Team member not found')
  res.json(u.toJSON())
}

export async function create(req, res) {
  const { name, role, email } = req.body
  if (!name || !role || !email) {
    throw new HttpError(400, 'name, role, and email are required')
  }
  if (!ROLES.includes(role)) {
    throw new HttpError(400, `role must be one of: ${ROLES.join(', ')}`)
  }

  // Allocate the next u<N>
  const team = await TeamMember.find().lean()
  const max = team.reduce((m, u) => {
    const n = parseInt(String(u._id).replace(/^u/, ''), 10)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  const id = makeUserId(max)
  const initials = name.split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase()

  const user = await TeamMember.create({ _id: id, name, role, email, avatar: initials })
  res.status(201).json(user.toJSON())
}

export async function update(req, res) {
  if (req.body.role && !ROLES.includes(req.body.role)) {
    throw new HttpError(400, `role must be one of: ${ROLES.join(', ')}`)
  }
  const u = await TeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!u) throw new HttpError(404, 'Team member not found')
  res.json(u.toJSON())
}

export async function remove(req, res) {
  const u = await TeamMember.findByIdAndDelete(req.params.id)
  if (!u) throw new HttpError(404, 'Team member not found')
  res.status(204).end()
}
