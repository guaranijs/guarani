if (Reflect == null || !('getMetadata' in Reflect)) {
  throw new Error('@guarani/di requires a Reflect Metadata polyfill.');
}

export { Container, DIContainer, getContainer } from './container/container';

export { Inject } from './decorators/inject';
export { InjectAll } from './decorators/inject-all';
export { Injectable } from './decorators/injectable';
export { LazyInject } from './decorators/lazy-inject';

export { DependencyInjectionException } from './exceptions/dependency-injection.exception';
export { InvalidProviderException } from './exceptions/invalid-provider.exception';
export { ResolutionException } from './exceptions/resolution.exception';
export { TokenNotRegisteredException } from './exceptions/token-not-registered.exception';

export { InjectableToken } from './injectable-token';

export { Lifecycle } from './lifecycle';

export { FactoryFunction } from './types/factory-function';
