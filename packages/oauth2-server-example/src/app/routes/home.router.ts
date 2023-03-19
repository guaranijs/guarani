import { Router } from 'express';

import { HomeController } from '../controllers/home.controller';

const router = Router();

router.route('/').get(HomeController.home);

export { router as homeRouter };
