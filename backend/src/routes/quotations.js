import { Router } from 'express'
import * as c from '../controllers/quotationController.js'
import { wrap } from '../middleware/async-handler.js'

const router = Router()

router.get   ('/',                  wrap(c.list))
router.post  ('/',                  wrap(c.create))
router.get   ('/:id',               wrap(c.get))
router.patch ('/:id',               wrap(c.update))
router.delete('/:id',               wrap(c.remove))

router.post  ('/:id/send',          wrap(c.send))
router.post  ('/:id/accept',        wrap(c.accept))
router.post  ('/:id/decline',       wrap(c.decline))

router.post  ('/:id/items',         wrap(c.addItem))
router.delete('/:id/items/:itemId', wrap(c.removeItem))

export default router
