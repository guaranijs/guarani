import { Request, Response } from 'express';

export function authenticated(request: Request, response: Response, next: Function): void {
  return request.user !== undefined ? next() : response.redirect('/auth/login');
}
