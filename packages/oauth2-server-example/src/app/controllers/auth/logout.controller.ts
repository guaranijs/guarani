import { Request, Response } from 'express';

import { Consent } from '../../entities/consent.entity';
import { Session } from '../../entities/session.entity';

class Controller {
  public async logout(request: Request, response: Response): Promise<void> {
    const sessionId: string | undefined = request.signedCookies['guarani:session'];

    if (typeof sessionId !== 'undefined') {
      const session = await Session.findOneBy({ id: sessionId });

      if (session !== null) {
        if (session.activeLogin !== null) {
          await Consent.delete({ user: { id: session.activeLogin.user.id } });
          await session.activeLogin.remove();
        }

        await session.remove();
      }

      response.clearCookie('guarani:session', { signed: true });
    }

    request.logout(() => undefined);

    return response.redirect(303, '/');
  }
}

export const LogoutController = new Controller();
