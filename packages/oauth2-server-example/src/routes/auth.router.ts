import csurf from 'csurf';
import { Router } from 'express';
import passport from 'passport';

import { LoginController } from '../controllers/auth/login.controller';
import { LogoutController } from '../controllers/auth/logout.controller';
import { RegisterController } from '../controllers/auth/register.controller';
import { authenticated } from '../guards/authenticated.guard';
import { unauthenticated } from '../guards/unauthenticated.guard';

const router = Router();
const csrf = csurf({ cookie: true, sessionKey: 'guarani' });

router
  .route('/register')
  .get(unauthenticated, csrf, RegisterController.get)
  .post(unauthenticated, csrf, RegisterController.post);

router
  .route('/login')
  .get(unauthenticated, csrf, LoginController.get)
  .post(
    unauthenticated,
    csrf,
    passport.authenticate('local', { failureRedirect: '/auth/login' }),
    LoginController.post
  );

router.route('/logout').get(authenticated, LogoutController.logout).post(authenticated, LogoutController.logout);

export { router as AuthRouter };
