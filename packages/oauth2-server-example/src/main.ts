import 'reflect-metadata';

import flash from 'connect-flash';
import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import express, { Application, json, static as expressStatic, urlencoded } from 'express';
import session from 'express-session';
import Redis from 'ioredis';
import nunjucks from 'nunjucks';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import path from 'path';

import { getContainer } from '@guarani/di';
import { expressAuthorizationServer, User, USER_SERVICE, UserServiceInterface } from '@guarani/oauth2-server';

import { router } from './app/router';
import { authorizationServerOptions } from './authorization-server.options';
import { dataSource } from './data-source.application';

function setupPassport(app: Application): void {
  const container = getContainer('oauth2');

  const userService = container.resolve<UserServiceInterface>(USER_SERVICE);

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      const user = await userService.findByResourceOwnerCredentials!(email, password);

      if (user === null) {
        return done(null, false, { message: 'Invalid Credentials' });
      }

      return done(null, user);
    })
  );

  passport.serializeUser<string>((user, done) => {
    return done(null, (<User>user).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    const user = await userService.findOne(id);
    return done(null, user ?? false);
  });

  app.use(passport.initialize());
  app.use(passport.session());
}

async function main(): Promise<void> {
  const app = express();
  const secret = 'super_safe_and_secret_passphrase_that_nobody_will_ever_be_able_to_guess';

  await dataSource.initialize();

  const redis = new Redis(process.env.REDIS_URL!);

  app.use(json());
  app.use(urlencoded({ extended: false }));

  app.use(cookieParser(secret));
  app.use(
    session({
      secret,
      name: 'guarani',
      resave: false,
      saveUninitialized: false,
      store: new RedisStore({ client: redis, prefix: 'guarani:' }),
    })
  );
  app.use(flash());

  app.use('/static', expressStatic(path.join(__dirname, 'assets')));

  nunjucks.configure(path.join(__dirname, 'views'), { autoescape: true, express: app });
  app.set('view engine', 'njk');

  app.use(await expressAuthorizationServer(authorizationServerOptions));

  setupPassport(app);

  app.use(router);

  app.listen(4000, '0.0.0.0', () => {
    console.log('Authorization server running on http://localhost:4000');
  });
}

main();
