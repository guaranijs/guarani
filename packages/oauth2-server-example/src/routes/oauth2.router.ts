import { Router } from 'express'
import { OAuth2Controller } from '../controllers'

const router = Router()

router
  .get('/oauth2/authorize', OAuth2Controller.authorize)
  .get('/oauth2/error', OAuth2Controller.error)
  .post('/oauth2/introspect', OAuth2Controller.introspect)
  .post('/oauth2/revoke', OAuth2Controller.revoke)
  .post('/oauth2/token', OAuth2Controller.token)

export { router as OAuth2Router }
