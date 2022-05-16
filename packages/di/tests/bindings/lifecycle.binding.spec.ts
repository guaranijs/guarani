import { Binding } from '../../lib/bindings/binding';
import { LifecycleBinding } from '../../lib/bindings/lifecycle.binding';
import { Lifecycle } from '../../lib/lifecycle';

describe('Lifecycle Binding', () => {
  const TOKEN = Symbol('TOKEN');

  let binding: Binding<any>;
  let lifecycleBinding: LifecycleBinding<any>;

  beforeEach(() => {
    binding = new Binding<any>(TOKEN);
    lifecycleBinding = new LifecycleBinding<any>(binding);
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
