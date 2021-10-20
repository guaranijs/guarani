import { Request, Response } from 'express'

class Controller {
  public async index(request: Request, response: Response) {
    const data = { ...request.query, ...request.body }
    return response.json(data)
  }
}

export const CallbackController = new Controller()
