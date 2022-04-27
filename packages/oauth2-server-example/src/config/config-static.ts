import express, { Express } from 'express';
import path from 'path';
import favicon from 'serve-favicon';

export function configStatic(app: Express): void {
  app.use(favicon(path.join(process.cwd(), 'src', 'static', 'favicon.ico')));
  app.use('/static', express.static(path.join(process.cwd(), 'src', 'static')));
}
