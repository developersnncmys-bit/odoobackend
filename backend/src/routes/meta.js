import { Router } from 'express'
import * as c from '../controllers/metaController.js'

const router = Router()

router.get('/', c.get)

export default router
