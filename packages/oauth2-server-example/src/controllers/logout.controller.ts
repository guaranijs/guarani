import { Request, Response } from 'express'

class Controller {
  public async logout(request: Request, response: Response) {
    request.logout()
    return response.redirect(303, '/auth/login')
  }
}

export const LogoutController = new Controller()
