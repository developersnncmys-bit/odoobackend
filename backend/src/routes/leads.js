import { Router } from 'express'
import * as c from '../controllers/leadController.js'
import { wrap } from '../middleware/async-handler.js'

const router = Router()

router.get   ('/',                  wrap(c.list))
router.post  ('/',                  wrap(c.create))
router.get   ('/:id',               wrap(c.get))
router.patch ('/:id',               wrap(c.update))
router.delete('/:id',               wrap(c.remove))

router.post  ('/:id/activities',    wrap(c.addActivity))
router.post  ('/:id/win',           wrap(c.win))
router.post  ('/:id/lose',          wrap(c.lose))
router.post  ('/:id/reopen',        wrap(c.reopen))

export default router
