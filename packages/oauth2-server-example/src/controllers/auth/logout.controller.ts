import { Request, Response } from 'express';

class Controller {
  public async logout(request: Request, response: Response): Promise<void> {
    request.logout();
    return response.redirect('/auth/login');
  }
}

export const LogoutController = new Controller();
