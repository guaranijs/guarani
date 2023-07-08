import { Router } from 'express';
import passport from 'passport';

import { ConsentController } from '../controllers/auth/consent.controller';
import { LoginController } from '../controllers/auth/login.controller';
import { LogoutController } from '../controllers/auth/logout.controller';
import { RegisterController } from '../controllers/auth/register.controller';
import { SelectAccountController } from '../controllers/auth/select-account.controller';

const router = Router();

router
  .route('/register')
  .get(async (req, res) => await RegisterController.get(req, res))
  .post(async (req, res) => await RegisterController.post(req, res));

router
  .route('/select-account')
  .get(async (req, res) => await SelectAccountController.get(req, res))
  .post(async (req, res) => await SelectAccountController.post(req, res));

router
  .route('/login')
  .get(async (req, res) => await LoginController.get(req, res))
  .post(
    passport.authenticate('local', { failureRedirect: '/auth/login', failureFlash: true }),
    async (req, res) => await LoginController.post(req, res)
  );

router
  .route('/consent')
  .get(async (req, res) => await ConsentController.get(req, res))
  .post(async (req, res) => await ConsentController.post(req, res));

router
  .route('/logout')
  .get(async (req, res) => await LogoutController.get(req, res))
  .post(async (req, res) => await LogoutController.post(req, res));

export { router as authRouter };
