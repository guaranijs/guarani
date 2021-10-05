import { Router } from 'express'

import { CallbackController } from '../controllers'

const router = Router()

router.get('/callback', CallbackController.get)

export { router as CallbackRouter }
