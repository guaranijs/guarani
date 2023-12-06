import { Buffer } from 'buffer';

import { Comparable, Dictionary } from '@guarani/types';

import { compare, isPlainObject, removeNullishValues } from './objects';

const invalidPlainObjects: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  'a',
  Symbol('a'),
  Buffer,
  Buffer.alloc(1),
  () => 1,
  [],
];

describe('removeNullishValues()', () => {
  it('should remove all undefined values from an object.', () => {
    const data: Dictionary<unknown>[] = [
      {
        name: 'John Doe',
        occupation: null,
        vehicle: undefined,
        age: 23,
        address: { streetAddress: '123 1st Avenue', referencePoint: null, owner: undefined, trees: ['Oak', null] },
        hobbies: ['Jogging', undefined, { name: 'Gambling', skills: ['Poker', 'Black Jack'] }],
      },
    ];

    expect(() => removeNullishValues(data)).not.toThrow();

    expect(data).toStrictEqual([
      {
        name: 'John Doe',
        age: 23,
        address: { streetAddress: '123 1st Avenue', trees: ['Oak'] },
        hobbies: ['Jogging', { name: 'Gambling', skills: ['Poker', 'Black Jack'] }],
      },
    ]);
  });
});

describe('isPlainObject()', () => {
  it.each(invalidPlainObjects)('should return false when the data is not a plain javascript object.', (data) => {
    expect(isPlainObject(data)).toBeFalse();
  });

  it.each([{}, Object.create(null)])('should return true when the data is a plain javascript object.', (data) => {
    expect(isPlainObject(data)).toBeTrue();
  });
});

describe('compare()', () => {
  it('should successfully compare two undefineds.', () => {
    expect(compare(undefined, undefined)).toEqual(0);
  });

  it('should throw when comparing at least one symbol.', () => {
    expect(() => compare(Symbol('ABCDE'), Symbol('ABCDE'))).toThrow(new TypeError('Cannot compare symbols.'));
    expect(() => compare(Symbol('ABCDE'), Symbol.for('ABCDE'))).toThrow(new TypeError('Cannot compare symbols.'));
    expect(() => compare(Symbol.for('ABCDE'), Symbol('ABCDE'))).toThrow(new TypeError('Cannot compare symbols.'));
    expect(() => compare(Symbol.for('ABCDE'), Symbol.for('ABCDE'))).toThrow(new TypeError('Cannot compare symbols.'));

    expect(() => compare(Symbol('ABCDE'), 'ABCDE')).toThrow(new TypeError('Cannot compare symbols.'));
    expect(() => compare('ABCDE', Symbol('ABCDE'))).toThrow(new TypeError('Cannot compare symbols.'));
    expect(() => compare(Symbol.for('ABCDE'), 'ABCDE')).toThrow(new TypeError('Cannot compare symbols.'));
    expect(() => compare('ABCDE', Symbol.for('ABCDE'))).toThrow(new TypeError('Cannot compare symbols.'));
  });

  it('should throw when comparing at least one function.', () => {
    expect(() => {
      return compare(
        () => null,
        () => null,
      );
    }).toThrow(new TypeError('Cannot compare functions.'));

    expect(() => {
      return compare(
        () => null,
        function () {
          return null;
        },
      );
    }).toThrow(new TypeError('Cannot compare functions.'));

    expect(() => {
      return compare(
        function () {
          return null;
        },
        () => null,
      );
    }).toThrow(new TypeError('Cannot compare functions.'));

    expect(() => {
      return compare(
        function () {
          return null;
        },
        function () {
          return null;
        },
      );
    }).toThrow(new TypeError('Cannot compare functions.'));

    expect(() => compare(() => null, 'ABCDE')).toThrow(new TypeError('Cannot compare functions.'));

    expect(() => compare('ABCDE', () => null)).toThrow(new TypeError('Cannot compare functions.'));

    expect(() => {
      return compare(function () {
        return null;
      }, 'ABCDE');
    }).toThrow(new TypeError('Cannot compare functions.'));

    expect(() => {
      return compare('ABCDE', function () {
        return null;
      });
    }).toThrow(new TypeError('Cannot compare functions.'));
  });

  it('should successfully compare two bigints.', () => {
    expect(compare(123n, 124n)).toEqual(-1);
    expect(compare(123n, 123n)).toEqual(0);
    expect(compare(124n, 123n)).toEqual(1);
  });

  it('should successfully compare two booleans.', () => {
    expect(compare(false, false)).toEqual(0);
    expect(compare(false, true)).toEqual(-1);
    expect(compare(true, false)).toEqual(1);
    expect(compare(true, true)).toEqual(0);
  });

  it('should successfully compare two NaNs.', () => {
    expect(compare(NaN, NaN)).toEqual(0);
    expect(compare(NaN, Number.NaN)).toEqual(0);
    expect(compare(Number.NaN, NaN)).toEqual(0);
    expect(compare(Number.NaN, Number.NaN)).toEqual(0);
  });

  it('should throw when comparing a NaN with a valid number.', () => {
    expect(() => compare(0, NaN)).toThrow(new TypeError('Cannot compare a number with a NaN.'));
    expect(() => compare(0, Number.NaN)).toThrow(new TypeError('Cannot compare a number with a NaN.'));
    expect(() => compare(NaN, 0)).toThrow(new TypeError('Cannot compare a number with a NaN.'));
    expect(() => compare(Number.NaN, 0)).toThrow(new TypeError('Cannot compare a number with a NaN.'));
  });

  it('should successfully compare two numbers.', () => {
    expect(compare(123, 124)).toEqual(-1);
    expect(compare(123, 123)).toEqual(0);
    expect(compare(124, 123)).toEqual(1);

    expect(compare(-1.72, -1.71)).toEqual(-1);
    expect(compare(-1.72, -1.72)).toEqual(0);
    expect(compare(-1.71, -1.72)).toEqual(1);
  });

  it('should successfully compare two strings.', () => {
    expect(compare('Foostring123', 'foostring123')).toEqual(-1);
    expect(compare('foostring123', 'foostring123')).toEqual(0);
    expect(compare('foostring123', 'Foostring123')).toEqual(1);
  });

  it('should successfully compare two nulls.', () => {
    expect(compare(null, null)).toEqual(0);
  });

  it('should successfully compare two buffers.', () => {
    expect(compare(Buffer.from([]), Buffer.from([]))).toEqual(0);
    expect(compare(Buffer.from([0x00]), Buffer.from([0x00]))).toEqual(0);

    expect(compare(Buffer.from([0x00]), Buffer.from([0x01]))).toEqual(-1);
    expect(compare(Buffer.from([0x00]), Buffer.from([0x00, 0x00]))).toEqual(-1);

    expect(compare(Buffer.from([0x01]), Buffer.from([0x00]))).toEqual(1);
    expect(compare(Buffer.from([0x01]), Buffer.from([0x00, 0x00]))).toEqual(1);
  });

  it('should successfully compare two dates.', () => {
    const now = Date.now();

    expect(compare(new Date(now), new Date(now))).toEqual(0);
    expect(compare(new Date(now), new Date(now + 1))).toEqual(-1);
    expect(compare(new Date(now + 1), new Date(now))).toEqual(1);
  });

  it('should successfully compare two arrays.', () => {
    expect(compare([], [])).toEqual(0);
    expect(compare([], [0])).toEqual(-1);
    expect(compare([0], [])).toEqual(1);

    expect(compare([0], [0])).toEqual(0);
    expect(compare([0], [1])).toEqual(-1);
    expect(compare([1], [0])).toEqual(1);
    expect(compare([1], [1])).toEqual(0);

    expect(compare([0], [0, 0])).toEqual(-1);
    expect(compare([0], [0, 1])).toEqual(-1);
    expect(compare([0], [1, 0])).toEqual(-1);
    expect(compare([0], [1, 1])).toEqual(-1);
    expect(compare([1], [0, 0])).toEqual(1);
    expect(compare([1], [0, 1])).toEqual(1);
    expect(compare([1], [1, 0])).toEqual(-1);
    expect(compare([1], [1, 1])).toEqual(-1);

    expect(compare([0, 0], [0])).toEqual(1);
    expect(compare([0, 1], [0])).toEqual(1);
    expect(compare([1, 0], [0])).toEqual(1);
    expect(compare([1, 1], [0])).toEqual(1);
    expect(compare([0, 0], [1])).toEqual(-1);
    expect(compare([0, 1], [1])).toEqual(-1);
    expect(compare([1, 0], [1])).toEqual(1);
    expect(compare([1, 1], [1])).toEqual(1);
  });

  it('should successfully compare two objects of the same type.', () => {
    class Foo implements Comparable<Foo> {
      public constructor(public readonly attr: number) {}

      public compare(other: Foo): number {
        return compare(this.attr, other.attr);
      }
    }

    expect(compare(new Foo(123), new Foo(124))).toEqual(-1);
    expect(compare(new Foo(123), new Foo(123))).toEqual(0);
    expect(compare(new Foo(124), new Foo(123))).toEqual(1);
  });

  it('should throw when at least one of the objects does not implement the method compare().', () => {
    const foo = { compare: (): number => 0 };

    expect(() => compare({}, {})).toThrow(new TypeError('Missing method "compare()" on parameter "obj1".'));
    expect(() => compare({}, foo)).toThrow(new TypeError('Missing method "compare()" on parameter "obj1".'));
    expect(() => compare(foo, {})).toThrow(new TypeError('Missing method "compare()" on parameter "obj2".'));
  });

  it('should successfully compare two objects of the same inheritance chain.', () => {
    class Foo implements Comparable<Foo> {
      public constructor(public readonly attr: number) {}

      public compare(other: Foo): number {
        return compare(this.attr, other.attr);
      }
    }

    class Bar extends Foo implements Comparable<Bar> {}

    expect(compare(new Foo(123), new Foo(124))).toEqual(-1);
    expect(compare(new Foo(123), new Foo(123))).toEqual(0);
    expect(compare(new Foo(124), new Foo(123))).toEqual(1);

    expect(compare(new Bar(123), new Bar(124))).toEqual(-1);
    expect(compare(new Bar(123), new Bar(123))).toEqual(0);
    expect(compare(new Bar(124), new Bar(123))).toEqual(1);

    expect(compare(new Foo(123), new Bar(124))).toEqual(-1);
    expect(compare(new Foo(123), new Bar(123))).toEqual(0);
    expect(compare(new Foo(124), new Bar(123))).toEqual(1);
  });

  it('should throw when comparing two objects of different types.', () => {
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

    expect(() => compare(undefined, null)).toThrow(new TypeError('Cannot compare objects of different types.'));

    expect(() => compare('string', 123)).toThrow(new TypeError('Cannot compare objects of different types.'));

    expect(() => compare(123, 123n)).toThrow(new TypeError('Cannot compare objects of different types.'));

    expect(() => compare([467, 124], [467, '124'])).toThrow(
      new TypeError('Cannot compare objects of different types.'),
    );

    expect(() => compare({ id: 1 }, Buffer.from([0x01]))).toThrow(
      new TypeError('Cannot compare objects of different types.'),
    );

    expect(() => compare(new Foo(123), new Bar(123))).toThrow(
      new TypeError('Cannot compare objects of different types.'),
    );
  });
});
