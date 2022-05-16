import { Router } from 'express';

import { AuthRouter } from './routes/auth.router';
import { HomeRouter } from './routes/home.router';
import { OAuthRouter } from './routes/oauth.router';

const router = Router();

router.use('/', HomeRouter);
router.use('/auth', AuthRouter);
router.use('/oauth', OAuthRouter);

export { router };
