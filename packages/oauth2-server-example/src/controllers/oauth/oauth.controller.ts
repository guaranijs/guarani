import { Request, Response } from 'express';

class Controller {
  public async callback(request: Request, response: Response): Promise<void> {
    response.json(request.query);
  }

  public async error(request: Request, response: Response): Promise<void> {
    response.json(request.query);
  }
}

export const OAuthController = new Controller();
