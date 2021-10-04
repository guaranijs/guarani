import { Request, Response } from 'express'

class Controller {
  public async index(request: Request, response: Response) {
    return response.render('auth/profile', {
      title: 'Profile',
      user: request.user
    })
  }
}

export const ProfileController = new Controller()
