import { Lifecycle } from '../types/lifecycle.enum';
import { Binding } from './binding';
import { LifecycleBinding } from './lifecycle.binding';

describe('Lifecycle Binding', () => {
  let binding: Binding<unknown>;
  let lifecycleBinding: LifecycleBinding<unknown>;

  beforeEach(() => {
    binding = new Binding<unknown>(Symbol('TOKEN'));
    lifecycleBinding = new LifecycleBinding<unknown>(binding);
  });

  describe('asSingleton()', () => {
    it('should set the scope as Singleton.', () => {
      lifecycleBinding.asSingleton();
      expect(binding.lifecycle).toBe(Lifecycle.Singleton);
    });
  });

  describe('asRequestScoped()', () => {
    it('should set the scope as Request.', () => {
      lifecycleBinding.asRequest();
      expect(binding.lifecycle).toBe(Lifecycle.Request);
    });
  });

  describe('asTransient()', () => {
    it('should set the scope as Transient.', () => {
      lifecycleBinding.asTransient();
      expect(binding.lifecycle).toBe(Lifecycle.Transient);
    });
  });
});
