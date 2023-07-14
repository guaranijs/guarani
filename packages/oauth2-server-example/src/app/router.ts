import { Router } from 'express';

import { authRouter } from './routes/auth.router';
import { homeRouter } from './routes/home.router';
import { profileRouter } from './routes/profile.router';

const router = Router();

router.use('/', homeRouter);
router.use('/auth', authRouter);
router.use('/profile', profileRouter);

export { router };
