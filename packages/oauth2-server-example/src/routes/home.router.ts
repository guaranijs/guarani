import { Router } from 'express'

import { HomeController } from '../controllers'
import { authenticated } from '../strategy'

const router = Router()

router.route('/').get(authenticated, HomeController.home)

export { router as HomeRouter }
