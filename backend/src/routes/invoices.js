import { Router } from 'express'
import * as c from '../controllers/invoiceController.js'
import { wrap } from '../middleware/async-handler.js'

const router = Router()

router.get   ('/',            wrap(c.list))
router.post  ('/',            wrap(c.create))
router.get   ('/:id',         wrap(c.get))
router.patch ('/:id',         wrap(c.update))
router.post  ('/:id/pay',     wrap(c.markPaid))

export default router
