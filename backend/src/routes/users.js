import { Router } from 'express'
import * as c from '../controllers/userController.js'
import { wrap } from '../middleware/async-handler.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

// All user-management endpoints require login.
// Mutations are Admin-only.
router.get   ('/',     requireAuth,                       wrap(c.list))
router.get   ('/:id',  requireAuth,                       wrap(c.get))
router.post  ('/',     requireAuth, requireRole('Admin'), wrap(c.create))
router.patch ('/:id',  requireAuth, requireRole('Admin'), wrap(c.update))
router.delete('/:id',  requireAuth, requireRole('Admin'), wrap(c.remove))

export default router
