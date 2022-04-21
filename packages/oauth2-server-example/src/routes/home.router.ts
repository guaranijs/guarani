import { Router } from 'express';

import { HomeController } from '../controllers/home.controller';
import { authenticated } from '../guards/authenticated.guard';

const HomeRouter = Router();

HomeRouter.get('/', authenticated, HomeController.home);
HomeRouter.get('/home', authenticated, HomeController.home);

export { HomeRouter };
