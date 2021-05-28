import { Router } from 'express'
import { authenticate } from 'passport'

import {
  CallbackController,
  HomeController,
  LoginController,
  LogoutController,
  RegisterController
} from './controllers'
import { authenticated, unauthenticated } from './strategy'

const router = Router()

router.route('/').get(authenticated, HomeController.home)

router.route('/callback').get(CallbackController.get)

router
  .route('/auth/login')
  .get(unauthenticated, LoginController.form)
  .post(
    unauthenticated,
    authenticate('local', { failureRedirect: '/auth/login' }),
    LoginController.login
  )

router
  .route('/auth/logout')
  .get(authenticated, LogoutController.logout)
  .post(authenticated, LogoutController.logout)

router
  .route('/auth/register')
  .get(unauthenticated, RegisterController.form)
  .post(unauthenticated, RegisterController.register)

export { router }
