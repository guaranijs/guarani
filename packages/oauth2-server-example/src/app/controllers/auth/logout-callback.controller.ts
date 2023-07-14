import { Request, Response } from 'express';

class Controller {
  public async logoutCallback(request: Request, response: Response): Promise<void> {
    return response.render('oauth/logout-callback', { request, title: 'Logout' });
  }
}

export const LogoutCallbackController = new Controller();
