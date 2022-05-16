import { NextFunction, Request, Response } from 'express';

export function authenticated(request: Request, response: Response, next: NextFunction): void {
  return request.user !== undefined ? next() : response.redirect(303, '/auth/login');
}
