import { Router } from 'express'
import { authenticate } from 'passport'

import {
  CallbackController,
  HomeController,
  LoginController,
  LogoutController,
  OAuth2Controller,
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

router
  .get('/oauth2/authorize', OAuth2Controller.authorize)
  .get('/oauth2/error', OAuth2Controller.error)
  .post('/oauth2/introspect', OAuth2Controller.introspect)
  .post('/oauth2/revoke', OAuth2Controller.revoke)
  .post('/oauth2/token', OAuth2Controller.token)

export { router }
