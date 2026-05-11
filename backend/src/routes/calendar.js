import { Router } from 'express'
import * as c from '../controllers/calendarController.js'
import { wrap } from '../middleware/async-handler.js'

const router = Router()

router.get   ('/',         wrap(c.list))
router.post  ('/',         wrap(c.create))
router.patch ('/:id',      wrap(c.update))
router.delete('/:id',      wrap(c.remove))

export default router
