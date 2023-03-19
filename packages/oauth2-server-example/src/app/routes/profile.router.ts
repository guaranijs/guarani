import csurf from 'csurf';
import { Router } from 'express';

import { ProfileController } from '../controllers/profile.controller';
import { authenticated } from '../guards/authenticated.guard';

const router = Router();
const csrf = csurf();

router.route('/').get(authenticated, csrf, ProfileController.index);

router
  .route('/edit')
  .get(authenticated, csrf, ProfileController.edit)
  .post(authenticated, csrf, ProfileController.editProfile);

export { router as profileRouter };
