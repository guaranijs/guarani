import argon2 from 'argon2';
import { Express } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import { User } from '../entities/user.entity';

export function passportConfig(app: Express): void {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await User.findOne({ where: { username } });

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
    return done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    const user = await User.findOneBy({ id });
    return user !== null ? done(null, user) : done(null, false);
  });

  app.use(passport.initialize());
  app.use(passport.session());
}
