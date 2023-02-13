import { Lifecycle } from '../types/lifecycle.enum';
import { Binding } from './binding';
import { LifecycleBinding } from './lifecycle.binding';

const TOKEN = Symbol('TOKEN');

describe('Lifecycle Binding', () => {
  let binding: Binding<unknown>;
  let lifecycleBinding: LifecycleBinding<unknown>;

  beforeEach(() => {
    binding = new Binding<unknown>(TOKEN);
    lifecycleBinding = new LifecycleBinding<unknown>(binding);
  });

  describe('asSingleton()', () => {
    it('should set the scope as Singleton.', () => {
      expect(lifecycleBinding.asSingleton()).toBeUndefined();
      expect(binding.lifecycle).toBe(Lifecycle.Singleton);
    });
  });

  describe('asRequestScoped()', () => {
    it('should set the scope as Request.', () => {
      expect(lifecycleBinding.asRequest()).toBeUndefined();
      expect(binding.lifecycle).toBe(Lifecycle.Request);
    });
  });

  describe('asTransient()', () => {
    it('should set the scope as Transient.', () => {
      expect(lifecycleBinding.asTransient()).toBeUndefined();
      expect(binding.lifecycle).toBe(Lifecycle.Transient);
    });
  });
});
