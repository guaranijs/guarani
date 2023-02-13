import { Lifecycle } from '../types/lifecycle.enum';
import { Binding } from './binding';

const TOKEN = Symbol('TOKEN');

describe('Binding', () => {
  it('should create a binding with default values.', () => {
    expect(new Binding<string>(TOKEN)).toMatchObject<Partial<Binding<string>>>({
      token: TOKEN,
      lifecycle: Lifecycle.Singleton,
    });
  });
});
