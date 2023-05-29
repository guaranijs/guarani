import { Lifecycle } from '../types/lifecycle.enum';
import { Binding } from './binding';

describe('Binding', () => {
  it('should create a binding with default values.', () => {
    const TOKEN = Symbol('TOKEN');

    expect(new Binding<string>(TOKEN)).toMatchObject<Partial<Binding<string>>>({
      token: TOKEN,
      lifecycle: Lifecycle.Singleton,
    });
  });
});
