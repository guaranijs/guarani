import { Router } from 'express'

import { AuthRouter, HomeRouter } from './routes'

const router = Router()

router.use('/', HomeRouter)
router.use('/auth', AuthRouter)

export { router }
