if (Reflect == null || !('getMetadata' in Reflect)) {
  throw new Error(`@guarani/ioc requires a Reflect Metadata polyfill.`)
}

export { Container, getContainer } from './container'
export { Inject, InjectAll, Injectable, LazyInject } from './decorators'
export { IoCError, TokenNotRegistered } from './exceptions'
