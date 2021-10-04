import { Request, Response } from 'express'

class Controller {
  public async form(request: Request, response: Response) {
    const csrf = request.csrfToken()

    return response.render('auth/login', {
      title: 'Login',
      actionUrl: request.originalUrl,
      csrf
    })
  }

  public async login(request: Request, response: Response) {
    const redirectTo = (request.query.redirect_to ?? '/') as string
    return response.redirect(303, redirectTo)
  }
}

export const LoginController = new Controller()
