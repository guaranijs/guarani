import { Request, Response } from 'express';

export function unauthenticated(request: Request, response: Response, next: Function): void {
  return request.user === undefined ? next() : response.redirect('/');
}
