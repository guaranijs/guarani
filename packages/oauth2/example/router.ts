import csurf from 'csurf'
import { Router } from 'express'
import { authenticate } from 'passport'

import {
  AssertionController,
  CallbackController,
  HomeController,
  LoginController,
  LogoutController,
  OAuth2Controller,
  RegisterController
} from './controllers'
import { authenticated, unauthenticated } from './strategy'

const csrf = csurf({ cookie: true, sessionKey: 'guarani' })

const router = Router()

router.route('/').get(authenticated, HomeController.home)

router.route('/callback').get(CallbackController.get)

router
  .route('/auth/login')
  .get(unauthenticated, csrf, LoginController.form)
  .post(
    unauthenticated,
    csrf,
    authenticate('local', { failureRedirect: '/auth/login' }),
    LoginController.login
  )

router
  .route('/auth/logout')
  .get(authenticated, LogoutController.logout)
  .post(authenticated, LogoutController.logout)

router
  .route('/auth/register')
  .get(unauthenticated, csrf, RegisterController.form)
  .post(unauthenticated, csrf, RegisterController.register)

router
  .get('/oauth2/authorize', csrf, OAuth2Controller.consent)
  .post('/oauth2/authorize', csrf, OAuth2Controller.authorize)
  .get('/oauth2/error', OAuth2Controller.error)
  .post('/oauth2/introspect', OAuth2Controller.introspect)
  .post('/oauth2/revoke', OAuth2Controller.revoke)
  .post('/oauth2/token', OAuth2Controller.token)

router
  .route('/oauth2/jwt-assertion')
  .get(csrf, AssertionController.get)
  .post(csrf, AssertionController.post)

export { router }
