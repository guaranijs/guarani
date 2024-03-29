import { Buffer } from 'buffer';

import { ClassProvider } from '../providers/class.provider';
import { FactoryProvider } from '../providers/factory.provider';
import { TokenProvider } from '../providers/token.provider';
import { ValueProvider } from '../providers/value.provider';
import { Binding } from './binding';
import { LifecycleBinding } from './lifecycle.binding';
import { ProviderBinding } from './provider.binding';

describe('Provider Binding', () => {
  let binding: Binding<Buffer>;
  let providerBinding: ProviderBinding<Buffer>;

  beforeEach(() => {
    binding = new Binding<Buffer>(Symbol('TOKEN'));
    providerBinding = new ProviderBinding<Buffer>(binding);
  });

  describe('toClass()', () => {
    it("should bind a class constructor as the token's provider.", () => {
      expect(providerBinding.toClass(Buffer)).toBeInstanceOf(LifecycleBinding);
      expect(binding.provider).toStrictEqual<ClassProvider<Buffer>>({ useClass: Buffer });
    });
  });

  describe('toFactory()', () => {
    it("should bind a factory function as the token's provider.", () => {
      const factory = () => Buffer.alloc(0);

      providerBinding.toFactory(factory);
      expect(binding.provider).toStrictEqual<FactoryProvider<Buffer>>({ useFactory: factory });
    });
  });

  describe('toToken()', () => {
    it("should use another token as token's provider.", () => {
      expect(providerBinding.toToken('Buffer')).toBeInstanceOf(LifecycleBinding);
      expect(binding.provider).toStrictEqual<TokenProvider<Buffer>>({ useToken: 'Buffer' });
    });
  });

  describe('toValue()', () => {
    it("should bind a value as the token's provider.", () => {
      providerBinding.toValue(Buffer.alloc(0));
      expect(binding.provider).toStrictEqual<ValueProvider<Buffer>>({ useValue: Buffer.alloc(0) });
    });
  });

  describe('toSelf()', () => {
    it('should throw when binding to itself if the token is not a constructor.', () => {
      expect(() => providerBinding.toSelf()).toThrow(
        new TypeError('The Token "Symbol(TOKEN)" is not a valid Constructor.'),
      );
    });

    it('should bind a constructor token to itself.', () => {
      const selfBinding = new Binding<Buffer>(Buffer);
      const selfProviderBinding = new ProviderBinding<Buffer>(selfBinding);

      expect(selfProviderBinding.toSelf()).toBeInstanceOf(LifecycleBinding);
      expect(selfBinding.provider).toStrictEqual<ClassProvider<Buffer>>({ useClass: Buffer });
    });
  });
});
