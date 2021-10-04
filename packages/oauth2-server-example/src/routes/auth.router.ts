import csurf from 'csurf'
import { Router } from 'express'
import { authenticate } from 'passport'

import {
  LoginController,
  LogoutController,
  ProfileController,
  RegisterController
} from '../controllers/auth'
import { authenticated, unauthenticated } from '../strategy'

const router = Router()
const csrf = csurf({ cookie: true, sessionKey: 'guarani' })

router
  .route('/login')
  .get(unauthenticated, csrf, LoginController.form)
  .post(
    unauthenticated,
    csrf,
    authenticate('local', { failureRedirect: '/auth/login' }),
    LoginController.login
  )

router
  .route('/logout')
  .get(authenticated, LogoutController.logout)
  .post(authenticated, LogoutController.logout)

router.route('/profile').get(authenticated, ProfileController.index)

router
  .route('/register')
  .get(unauthenticated, csrf, RegisterController.form)
  .post(unauthenticated, csrf, RegisterController.register)

export { router as AuthRouter }
