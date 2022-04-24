import { Request, Response } from 'express';

class Controller {
  public async get(request: Request, response: Response): Promise<void> {
    response.json(request.query);
  }
}

export const CallbackController = new Controller();
