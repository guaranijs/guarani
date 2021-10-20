import { NextFunction, Request, Response } from 'express'

export function unauthenticated(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  return request.user == null ? next() : response.redirect(303, '/')
}
