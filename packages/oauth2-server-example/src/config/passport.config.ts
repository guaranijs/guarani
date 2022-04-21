import argon2 from 'argon2';
import { Express } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import { UserEntity } from '../entities/user.entity';

export function passportConfig(app: Express): void {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await UserEntity.findOne({ where: { username } });

      if (user === null) {
        return done(null, false);
      }

      const passwordChecks = await argon2.verify(user.password, password, { type: argon2.argon2id });

      if (!passwordChecks) {
        return done(null, false);
      }

      return done(null, user);
    })
  );

  passport.serializeUser((user, done) => {
    return done(null, (user as UserEntity).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    const user = await UserEntity.findOneBy({ id });
    return user !== null ? done(null, user) : done(null, false);
  });

  app.use(passport.initialize());
  app.use(passport.session());
}
