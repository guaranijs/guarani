import { Comparable } from '@guarani/types';

import { compare } from '../lib/compare';

describe('compare()', () => {
  it('should fail when comparing two objects of different types.', () => {
    class Foo implements Comparable<Foo> {
      public constructor(public readonly attr: number) {}

      public compare(other: Foo): number {
        return compare(this.attr, other.attr);
      }
    }

    class Bar implements Comparable<Bar> {
      public constructor(public readonly attr: number) {}

      public compare(other: Bar): number {
        return compare(this.attr, other.attr);
      }
    }

    expect(() => compare(undefined, null)).toThrow();
    expect(() => compare('string', 123)).toThrow();
    expect(() => compare(123, 123n)).toThrow();
    expect(() => compare([467, 124], [467, '124'])).toThrow();
    expect(() => compare({ id: 1 }, Buffer.from([0x01]))).toThrow();
    expect(() => compare(new Foo(123), new Bar(123))).toThrow();
  });

  it('should return 0 when both objects are undefined.', () => {
    expect(compare(undefined, undefined)).toBe(0);
  });

  it('should return 0 when both objects are null.', () => {
    expect(compare(null, null)).toBe(0);
  });

  it('should successfully compare two bigints.', () => {
    expect(compare(123n, 124n)).toBe(-1);
    expect(compare(123n, 123n)).toBe(0);
    expect(compare(124n, 123n)).toBe(1);
  });

  it('should successfully compare two numbers.', () => {
    expect(compare(123, 124)).toBe(-1);
    expect(compare(123, 123)).toBe(0);
    expect(compare(124, 123)).toBe(1);

    expect(compare(-1.72, -1.71)).toBe(-1);
    expect(compare(-1.72, -1.72)).toBe(0);
    expect(compare(-1.71, -1.72)).toBe(1);
  });

  it('should successfully compare two strings.', () => {
    expect(compare('Foostring123', 'foostring123')).toBe(-1);
    expect(compare('foostring123', 'foostring123')).toBe(0);
    expect(compare('foostring123', 'Foostring123')).toBe(1);
  });

  it('should successfully compare two Buffers.', () => {
    expect(compare(Buffer.from([]), Buffer.from([]))).toBe(0);
    expect(compare(Buffer.from([0x00]), Buffer.from([0x00]))).toBe(0);

    expect(compare(Buffer.from([0x00]), Buffer.from([0x01]))).toBe(-1);
    expect(compare(Buffer.from([0x00]), Buffer.from([0x00, 0x00]))).toBe(-1);

    expect(compare(Buffer.from([0x01]), Buffer.from([0x00]))).toBe(1);
    expect(compare(Buffer.from([0x01]), Buffer.from([0x00, 0x00]))).toBe(1);
  });

  it('should successfully compare two Arrays.', () => {
    expect(compare([], [])).toBe(0);
    expect(compare([0x00], [0x00])).toBe(0);

    expect(compare([0x00], [0x01])).toBe(-1);
    expect(compare([0x00], [0x00, 0x00])).toBe(-1);

    expect(compare([0x01], [0x00])).toBe(1);
    expect(compare([0x01], [0x00, 0x00])).toBe(1);
  });

  it('should successfully compare two Objects of the same type.', () => {
    class Foo implements Comparable<Foo> {
      public constructor(public readonly attr: number) {}

      public compare(other: Foo): number {
        return compare(this.attr, other.attr);
      }
    }

    expect(compare(new Foo(123), new Foo(124))).toBe(-1);
    expect(compare(new Foo(123), new Foo(123))).toBe(0);
    expect(compare(new Foo(124), new Foo(123))).toBe(1);
  });

  it('should successfully compare two Objects of the same inheritance chain.', () => {
    class Foo implements Comparable<Foo> {
      public constructor(public readonly attr: number) {}

      public compare(other: Foo): number {
        return compare(this.attr, other.attr);
      }
    }

    class Bar extends Foo implements Comparable<Bar> {}

    expect(compare(new Foo(123), new Bar(124))).toBe(-1);
    expect(compare(new Foo(123), new Bar(123))).toBe(0);
    expect(compare(new Foo(124), new Bar(123))).toBe(1);
  });
});
