import { Router } from 'express'
import * as c from '../controllers/authController.js'
import { wrap } from '../middleware/async-handler.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// public
router.get ('/status', wrap(c.status))
router.post('/setup',  wrap(c.setup))
router.post('/login',  wrap(c.login))

// protected
router.get ('/me',      requireAuth, wrap(c.me))
router.post('/logout',  requireAuth, wrap(c.logout))

export default router
