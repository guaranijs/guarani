import { Hashable } from '@guarani/types';

import { hash } from '../lib/hash';

describe('hash()', () => {
  it('should fail when hashing an undefined object.', () => {
    expect(() => hash(undefined!)).toThrow();
  });

  it('should fail when hashing a null object.', () => {
    expect(() => hash(null!)).toThrow();
  });

  it('should fail when hashing a non-hashable object.', () => {
    // @ts-expect-error
    expect(() => hash({ id: 'fa467cd9', name: 'John Doe', age: 23 })).toThrow();
  });

  it('should hash a BigInt.', () => {
    expect(hash(123456789n)).toBe(123456789);
  });

  it('should hash a Number.', () => {
    expect(hash(123456789)).toBe(123456789);
    expect(hash(-123456789)).toBe(123456789);

    expect(hash(12.1)).toBe(12);
    expect(hash(12.7)).toBe(13);
  });

  it.todo('should hash a Function or a Class definition.');

  it('should hash a String.', () => {
    expect(hash('')).toBe(0);
    expect(hash('Hello, World!')).toBe(1498789909);
  });

  it('should hash a Buffer.', () => {
    expect(hash(Buffer.from([]))).toBe(0);
    expect(hash(Buffer.from('Hello, World!'))).toBe(1498789909);
  });

  it('should hash an Array.', () => {
    expect(hash([])).toBe(0);
    expect(hash('Hello, World!'.split(''))).toBe(1498789909);
  });

  it('should hash a Hashable Object.', () => {
    class Foo implements Hashable {
      public hashCode(): number {
        return 0;
      }
    }

    expect(() => hash(new Foo())).not.toThrow();
  });
});
