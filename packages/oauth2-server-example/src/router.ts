import { Router } from 'express';

import { AuthRouter } from './routes/auth.router';
import { CallbackRouter } from './routes/callback.router';
import { HomeRouter } from './routes/home.router';
import { OAuth2Router } from './routes/oauth2.router';

const router = Router();

router.use('/', HomeRouter, CallbackRouter);
router.use('/auth', AuthRouter);
router.use('/oauth2', OAuth2Router);

export { router };
