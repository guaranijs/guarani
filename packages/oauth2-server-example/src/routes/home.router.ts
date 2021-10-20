import { Router } from 'express'

import { CallbackController, HomeController } from '../controllers/home'
import { authenticated } from '../middlewares'

const router = Router()

router.route('/').get(authenticated, HomeController.home)
router.route('/callback').get(CallbackController.index)

export { router as HomeRouter }
