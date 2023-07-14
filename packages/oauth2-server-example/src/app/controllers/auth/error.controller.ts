import { Request, Response } from 'express';

class Controller {
  public async error(request: Request, response: Response): Promise<void> {
    const parameters = request.query;

    if (parameters.error === 'login_required') {
      request.logout(() => null);
    }

    return response.render('oauth/error', { request, title: 'OAuth 2.0 Error', parameters });
  }
}

export const ErrorController = new Controller();
