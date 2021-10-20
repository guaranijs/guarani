import csurf from 'csurf'
import { Router } from 'express'
import { authenticate } from 'passport'

import {
  LoginController,
  LogoutController,
  ProfileController,
  RegisterController
} from '../controllers/auth'
import { authenticated, unauthenticated } from '../middlewares'

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
  .route('/profile/edit')
  .get(authenticated, csrf, ProfileController.editProfile)
  .post(authenticated, csrf, ProfileController.doEditProfile)

router
  .route('/register')
  .get(unauthenticated, csrf, RegisterController.registerForm)
  .post(unauthenticated, csrf, RegisterController.register)

export { router as AuthRouter }
