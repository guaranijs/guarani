import { Request, Response } from 'express';

class Controller {
  public async get(request: Request, response: Response): Promise<void> {
    return response.render('auth/login', { request, title: 'Login' });
  }

  public async post(request: Request, response: Response): Promise<void> {
    const redirectTo = <string>request.query.redirect_to ?? '/';
    return response.redirect(303, redirectTo);
  }
}

export const LoginController = new Controller();
