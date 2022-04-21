import { Request, Response } from 'express';

class Controller {
  public async get(request: Request, response: Response): Promise<void> {
    return response.render('auth/login', { title: 'Login', csrf: request.csrfToken() });
  }

  public async post(request: Request, response: Response): Promise<void> {
    const redirectTo = <string>(request.query.redirect_to ?? '/');
    return response.redirect(redirectTo);
  }
}

export const LoginController = new Controller();
