import argon2 from 'argon2'
import { Express } from 'express'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { getRepository } from 'typeorm'

import { User } from '../entities'

export async function configurePassport(app: Express): Promise<void> {
  const userRepository = getRepository(User)

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (username, password, done) => {
        const user = await userRepository.findOne({
          where: { email: username }
        })

        if (!user) {
          return done(null, false)
        }

        if (
          !(await argon2.verify(user.password, password, {
            type: argon2.argon2id
          }))
        ) {
          return done(null, false)
        }

        return done(null, user)
      }
    )
  )

  passport.serializeUser((user, done) => {
    return done(null, (user as User).id)
  })

  passport.deserializeUser(async (id, done) => {
    const user = await userRepository.findOne(id)
    return user ? done(null, user) : done(null, false)
  })

  app.use(passport.initialize())
  app.use(passport.session())
}
