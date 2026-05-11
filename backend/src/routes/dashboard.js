import { Router } from 'express'
import * as c from '../controllers/dashboardController.js'
import { wrap } from '../middleware/async-handler.js'

const router = Router()

router.get('/summary',           wrap(c.summary))
router.get('/lead-sources',      wrap(c.leadSources))
router.get('/by-category',       wrap(c.byCategory))
router.get('/team-productivity', wrap(c.teamProductivity))
router.get('/upcoming',           wrap(c.upcoming))
router.get('/lost-leads',         wrap(c.lostLeads))

export default router
