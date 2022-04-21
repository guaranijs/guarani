import { Router } from 'express';

import { OAuth2Controller } from '../controllers/oauth2.controller';

const OAuth2Router = Router();

OAuth2Router.get('/authorize', OAuth2Controller.authorize)
  .get('/error', OAuth2Controller.error)
  .post('/token', OAuth2Controller.token);

export { OAuth2Router };
