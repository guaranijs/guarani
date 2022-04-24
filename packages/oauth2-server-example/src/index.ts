import { TypeormStore } from 'connect-typeorm';
import cookieParser from 'cookie-parser';
import express from 'express';
import session from 'express-session';
// @ts-expect-error
import handlebarsLayouts from 'handlebars-layouts';
import hbs from 'hbs';
import morgan from 'morgan';
import path from 'path';
import serveFavicon from 'serve-favicon';
import { passportConfig } from './config/passport.config';

import { typeormConfig } from './config/typeorm.config';
import { Session } from './entities/session.entity';
import { router } from './router';

const secret = 'horGHmztKplp50r7Z9t2ydxnvWgHoJjE';

async function main(): Promise<void> {
  const app = express();

  const dataSource = await typeormConfig();

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'hbs');

  // @ts-expect-error
  hbs.registerHelper(handlebarsLayouts(hbs.handlebars));
  hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

  app.use(morgan('dev'));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser(secret));
  app.use(
    session({
      name: 'guarani',
      secret,
      resave: false,
      saveUninitialized: false,
      store: new TypeormStore({ cleanupLimit: 2, ttl: 43200 }).connect(dataSource.getRepository(Session)),
    })
  );

  passportConfig(app);

  app.use(serveFavicon(path.join(__dirname, 'static', 'favicon.ico')));
  app.use('/static', express.static(path.join(__dirname, 'static')));

  app.use(router);

  app.listen(3000, () => {
    console.log(`Running on port "3000".`);
  });
}

main();
