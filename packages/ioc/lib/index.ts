if (Reflect == null || !('getMetadata' in Reflect))
  throw new Error(`@guarani/ioc requires a Reflect Metadata polyfill.`)

export { Container } from './container'
export { Inject, InjectAll, Injectable } from './decorators'
export { IoCError, TokenNotRegistered } from './exceptions'
export { Constructor, Factory } from './types'
