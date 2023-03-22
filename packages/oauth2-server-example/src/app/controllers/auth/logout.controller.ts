import { Request, Response } from 'express';

import { Session } from '../../entities/session.entity';

class Controller {
  public async logout(request: Request, response: Response): Promise<void> {
    let sessionId: string | undefined;

    if ((sessionId = request.signedCookies['guarani:session']) !== undefined) {
      await Session.delete({ id: sessionId });
    }

    request.logout(() => undefined);

    return response.redirect(303, '/auth/login');
  }
}

export const LogoutController = new Controller();
