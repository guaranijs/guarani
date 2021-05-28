import argon2 from 'argon2'
import { Express, Request, Response } from 'express'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'

import { User } from './entities'

export function initialize(app: Express): void {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (username, password, done) => {
        const user = await User.findOne({ where: { email: username } })

        if (!user) return done(null, false)

        if (
          !(await argon2.verify(user.password, password, {
            type: argon2.argon2id
          }))
        )
          return done(null, false)

        return done(null, user)
      }
    )
  )

  passport.serializeUser((user, done) => {
    return done(null, (user as User).id)
  })

  passport.deserializeUser(async (id, done) => {
    const user = await User.findOne(id)
    return user ? done(null, user) : done(null, false)
  })

  app.use(passport.initialize())
  app.use(passport.session())
}

export function authenticated(
  request: Request,
  response: Response,
  next: Function
): void {
  const { user } = request
  if (user) return next()
  return response.redirect(303, '/auth/login')
}

export function unauthenticated(
  request: Request,
  response: Response,
  next: Function
): void {
  const { user } = request
  if (!user) return next()
  return response.redirect(303, '/')
}
