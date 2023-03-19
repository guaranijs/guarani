import csurf from 'csurf';
import { Router } from 'express';
import passport from 'passport';

import { ConsentController } from '../controllers/auth/consent.controller';
import { LoginController } from '../controllers/auth/login.controller';
import { LogoutController } from '../controllers/auth/logout.controller';
import { RegisterController } from '../controllers/auth/register.controller';
import { authenticated } from '../guards/authenticated.guard';
import { unauthenticated } from '../guards/unauthenticated.guard';

const router = Router();
const csrf = csurf();

router
  .route('/register')
  .get(unauthenticated, csrf, RegisterController.get)
  .post(unauthenticated, csrf, RegisterController.post);

router
  .route('/login')
  .get(csrf, async (req, res) => await LoginController.get(req, res))
  .post(
    csrf,
    passport.authenticate('local', { failureRedirect: '/auth/login', failureFlash: true }),
    async (req, res) => await LoginController.post(req, res)
  );

router
  .route('/consent')
  .get(authenticated, csrf, ConsentController.get)
  .post(authenticated, csrf, ConsentController.post);

router.route('/logout').get(authenticated, LogoutController.logout).post(authenticated, LogoutController.logout);

export { router as authRouter };
