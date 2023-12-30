import { Request, Response } from 'express';

class Controller {
  public async backChannelCallback(request: Request, response: Response): Promise<void> {
    console.log(`Back-Channel called with logout token: ${request.body.logout_token}`);
    response.status(200).send();
  }
}

export const BackChannelController = new Controller();
