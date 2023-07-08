import { Router } from 'express';

import { ProfileController } from '../controllers/profile.controller';
import { authenticated } from '../guards/authenticated.guard';

const router = Router();

router.route('/').get(authenticated, ProfileController.index);

router.route('/edit').get(authenticated, ProfileController.edit).post(authenticated, ProfileController.editProfile);

export { router as profileRouter };
