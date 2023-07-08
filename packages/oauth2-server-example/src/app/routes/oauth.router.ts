import { Router } from 'express';

import { OAuthController } from '../controllers/oauth.controller';

const router = Router();

router.route('/callback').get(async (req, res) => await OAuthController.callback(req, res));
router.route('/logout_callback').get(async (req, res) => await OAuthController.logoutCallback(req, res));
router.route('/error').get(async (req, res) => await OAuthController.error(req, res));

export { router as oauthRouter };
