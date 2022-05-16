import { NextFunction, Request, Response } from 'express';

export function unauthenticated(request: Request, response: Response, next: NextFunction): void {
  return request.user === undefined ? next() : response.redirect(303, '/');
}
