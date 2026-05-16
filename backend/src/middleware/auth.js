// Express middlewares that gate routes behind a valid bearer token.
//   - requireAuth: any logged-in user
//   - requireRole('Admin', ...): subset of roles allowed
//
// Reads `Authorization: Bearer <token>` and verifies via utils/auth.js.
// On success, attaches `req.user` (the User document, minus passwordHash).

import { verifyToken } from '../utils/auth.js'
import { User } from '../models/index.js'
import { HttpError } from './async-handler.js'

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || ''
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null
    const payload = verifyToken(token)
    if (!payload?.sub) return next(new HttpError(401, 'Authentication required'))

    const user = await User.findById(payload.sub)
    if (!user || user.active === false) return next(new HttpError(401, 'Account is inactive'))

    req.user = user.toJSON()
    next()
  } catch (e) { next(e) }
}

export function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'Authentication required'))
    if (!allowed.includes(req.user.role)) return next(new HttpError(403, 'Insufficient permissions'))
    next()
  }
}
