import { Router } from 'express';

import { HomeController } from '../controllers/home/home.controller';

const router = Router();

router.get('/', HomeController.home);

export { router as HomeRouter };
