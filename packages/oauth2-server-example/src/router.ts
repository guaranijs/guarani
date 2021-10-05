import { Router } from 'express'

import { AuthRouter, CallbackRouter, HomeRouter, OAuth2Router } from './routes'

const router = Router()

router.use('/', HomeRouter, CallbackRouter)
router.use('/auth', AuthRouter)
router.use('/oauth2', OAuth2Router)

export { router }
