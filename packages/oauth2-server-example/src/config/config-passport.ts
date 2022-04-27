import bcrypt from 'bcrypt';
import { Express } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import { UserEntity } from '../entities/user.entity';

export function configPassport(app: Express): void {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      const user = await UserEntity.findOneBy({ email });

      if (user === null) {
        return done(null, false);
      }

      if (!(await bcrypt.compare(password, user.password))) {
        return done(null, false);
      }

      return done(null, user);
    })
  );

  passport.serializeUser<string>((user, done) => {
    return done(null, (<UserEntity>user).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    const user = await UserEntity.findOneBy({ id });
    return done(null, user ?? false);
  });

  app.use(passport.initialize());
  app.use(passport.session());
}
