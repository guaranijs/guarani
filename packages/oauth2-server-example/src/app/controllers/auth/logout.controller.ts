import { Request, Response } from 'express';

class Controller {
  public async logout(request: Request, response: Response): Promise<void> {
    request.logout(() => undefined);
    return response.redirect(303, '/auth/login');
  }
}

export const LogoutController = new Controller();
