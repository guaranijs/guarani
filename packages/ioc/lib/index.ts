if (Reflect == null || !('getMetadata' in Reflect)) {
  throw new Error(`@guarani/ioc requires a Reflect Metadata polyfill.`);
}

export { Container, IoCContainer, getContainer } from './container/container';
export { Inject } from './decorators/inject';
export { InjectAll } from './decorators/inject-all';
export { Injectable } from './decorators/injectable';
export { LazyInject } from './decorators/lazy-inject';
export { IoCError, TokenNotRegistered } from './exceptions';
export { InjectableToken } from './tokens';
