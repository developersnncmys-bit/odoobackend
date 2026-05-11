import { Router } from 'express'
import * as c from '../controllers/notificationController.js'
import { wrap } from '../middleware/async-handler.js'

const router = Router()

router.get  ('/',                 wrap(c.list))
router.post ('/',                 wrap(c.create))
router.patch('/:id/read',         wrap(c.markRead))
router.post ('/mark-all-read',    wrap(c.markAllRead))

export default router
