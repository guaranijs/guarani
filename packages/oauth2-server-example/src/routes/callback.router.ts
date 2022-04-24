import { Router } from 'express';

import { CallbackController } from '../controllers/callback.controller';

const CallbackRouter = Router();

CallbackRouter.get('/callback', CallbackController.get);

export { CallbackRouter };
