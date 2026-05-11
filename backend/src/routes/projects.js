import { Router } from 'express'
import * as c from '../controllers/projectController.js'
import { wrap } from '../middleware/async-handler.js'

const router = Router()

router.get   ('/',                          wrap(c.list))
router.post  ('/',                          wrap(c.create))
router.get   ('/:id',                       wrap(c.get))
router.patch ('/:id',                       wrap(c.update))

// Tasks
router.post  ('/:id/tasks',                 wrap(c.addTask))
router.patch ('/:id/tasks/:taskId',         wrap(c.updateTask))
router.delete('/:id/tasks/:taskId',         wrap(c.removeTask))

// Vendors
router.post  ('/:id/vendors',               wrap(c.addVendor))

// Project chatbox (§10.2)
router.get   ('/:id/messages',              wrap(c.listMessages))
router.post  ('/:id/messages',              wrap(c.postMessage))

export default router
