if (Reflect == null || !('getMetadata' in Reflect)) {
  throw new Error('@guarani/di requires a Reflect Metadata polyfill.');
}

// Dependency Injection Container.
export { Container, DependencyInjectionContainer, getContainer } from './lib/container/dependency-injection.container';

// Decorators
export { Inject } from './lib/decorators/inject.decorator';
export { InjectAll } from './lib/decorators/inject-all.decorator';
export { Injectable } from './lib/decorators/injectable.decorator';
export { LazyInject } from './lib/decorators/lazy-inject.decorator';
export { LazyInjectAll } from './lib/decorators/lazy-inject-all.decorator';
export { Optional } from './lib/decorators/optional.decorator';

// Exceptions
export { DependencyInjectionException } from './lib/exceptions/dependency-injection.exception';
export { InvalidProviderException } from './lib/exceptions/invalid-provider.exception';
export { ResolutionException } from './lib/exceptions/resolution.exception';
export { TokenNotRegisteredException } from './lib/exceptions/token-not-registered.exception';

// Providers
export { ClassProvider, isClassProvider } from './lib/providers/class.provider';
export { FactoryProvider, isFactoryProvider } from './lib/providers/factory.provider';
export { isProvider, Provider } from './lib/providers/provider';
export { isTokenProvider, TokenProvider } from './lib/providers/token.provider';
export { isValueProvider, ValueProvider } from './lib/providers/value.provider';

// Types
export { Factory } from './lib/types/factory.type';
export { InjectableToken, isInjectableToken } from './lib/types/injectable-token.type';
export { Lifecycle } from './lib/types/lifecycle.enum';
