import { Router } from 'express'

import { AuthRouter, HomeRouter, OAuth2Router } from './routes'

const router = Router()

router.use('/', HomeRouter, OAuth2Router)
router.use('/auth', AuthRouter)

export { router }
