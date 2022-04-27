import 'reflect-metadata';

import { expressProvider } from '@guarani/oauth2-server';

import { TypeormStore } from 'connect-typeorm';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express, { urlencoded } from 'express';
import session from 'express-session';

import { configOrm } from './config/config-orm';
import { configPassport } from './config/config-passport';
import { configStatic } from './config/config-static';
import { configViews } from './config/config-views';
import { Session } from './entities/session.entity';
import { oauthOptions } from './oauth.options';
import { router } from './router';

dotenv.config();

const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
const SECRET = process.env.SECRET!;

async function main(): Promise<void> {
  const app = express();

  const dataSource = await configOrm();
  const sessionRepository = dataSource.getRepository(Session);

  app.use(urlencoded({ extended: false }));
  app.use(cookieParser(SECRET));
  app.use(
    session({
      secret: SECRET,
      name: 'guarani',
      resave: false,
      saveUninitialized: false,
      store: new TypeormStore({ cleanupLimit: 2, ttl: 43200 }).connect(sessionRepository),
    })
  );

  configPassport(app);
  configViews(app);
  configStatic(app);

  app.use(await expressProvider(oauthOptions));
  app.use(router);

  app.listen(PORT, () => console.log(`Authorization Server running at http://localhost:${PORT}`));
}

main();
