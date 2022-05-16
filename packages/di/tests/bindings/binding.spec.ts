import { Binding } from '../../lib/bindings/binding';
import { Lifecycle } from '../../lib/lifecycle';

describe('Binding', () => {
  const TOKEN = Symbol('TOKEN');

  it('should create a binding with default values.', () => {
    expect(new Binding<string>(TOKEN)).toMatchObject<Partial<Binding<string>>>({
      token: TOKEN,
      lifecycle: Lifecycle.Transient,
    });
  });
});
