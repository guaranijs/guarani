import { Binding } from '../../lib/bindings/binding';
import { LifecycleBinding } from '../../lib/bindings/lifecycle.binding';
import { ProviderBinding } from '../../lib/bindings/provider.binding';
import { ClassProvider } from '../../lib/providers/class.provider';
import { FactoryProvider } from '../../lib/providers/factory.provider';
import { TokenProvider } from '../../lib/providers/token.provider';
import { ValueProvider } from '../../lib/providers/value.provider';

describe('Provider Binding', () => {
  const TOKEN = Symbol('TOKEN');

  let binding: Binding<Buffer>;
  let providerBinding: ProviderBinding<Buffer>;

  beforeEach(() => {
    binding = new Binding<Buffer>(TOKEN);
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
      expect(providerBinding.toFactory(factory)).toBeUndefined();
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
      expect(providerBinding.toValue(Buffer.alloc(0))).toBeUndefined();
      expect(binding.provider).toStrictEqual<ValueProvider<Buffer>>({ useValue: Buffer.alloc(0) });
    });
  });

  describe('toSelf()', () => {
    it('should reject binding to itself when the token is not a constructor.', () => {
      expect(() => providerBinding.toSelf()).toThrow(TypeError);
    });

    it('should bind a constructor token to itself.', () => {
      const selfBinding = new Binding<Buffer>(Buffer);
      const selfProviderBinding = new ProviderBinding<Buffer>(selfBinding);

      expect(selfProviderBinding.toSelf()).toBeInstanceOf(LifecycleBinding);
      expect(selfBinding.provider).toStrictEqual<ClassProvider<Buffer>>({ useClass: Buffer });
    });
  });
});
