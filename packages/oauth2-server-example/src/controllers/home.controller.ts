import { Request, Response } from 'express';

class Controller {
  public async home(request: Request, response: Response): Promise<void> {
    response.render('home', { request, title: 'Home' });
  }
}

export const HomeController = new Controller();
