import { Router } from 'express'
import { OAuth2Controller } from '../controllers'

const router = Router()

router
  .get('/authorize', OAuth2Controller.authorize)
  .get('/error', OAuth2Controller.error)
  .post('/introspect', OAuth2Controller.introspect)
  .post('/revoke', OAuth2Controller.revoke)
  .post('/token', OAuth2Controller.token)

export { router as OAuth2Router }
