import { Express } from 'express';
import nunjucks from 'nunjucks';
import path from 'path';

export function configViews(app: Express): void {
  nunjucks.configure(path.join(process.cwd(), 'src', 'views'), { autoescape: true, express: app });
  app.set('view engine', 'njk');
}
