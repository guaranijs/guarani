import { Router } from 'express';

import { OAuthController } from '../controllers/oauth.controller';

const router = Router();

router.route('/callback').get(OAuthController.callback);
router.route('/error').get(OAuthController.error);

export { router as oauthRouter };
