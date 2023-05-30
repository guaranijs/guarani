import 'jest-extended';

import * as Enum from '../lib/enum';

enum IntEnum {
  One = 1,
  Two = 2,
  Four = 4,
  Eight = 8,
  AnotherOne = 1,
}

enum StringEnum {
  Foo = 'foo',
  Bar = 'bar',
  Baz = 'baz',
  Qux = 'qux',
  AnotherFoo = 'foo',
}

describe('getKeys()', () => {
  it("should return all the members' keys of the enum.", () => {
    expect(Enum.getKeys(IntEnum)).toEqual(['One', 'Two', 'Four', 'Eight', 'AnotherOne']);
    expect(Enum.getKeys(StringEnum)).toEqual(['Foo', 'Bar', 'Baz', 'Qux', 'AnotherFoo']);
  });
});

describe('getKey()', () => {
  it('should return null when the provided key is not a member of the enum.', () => {
    expect(Enum.getKey(IntEnum, 3)).toBeNull();
    expect(Enum.getKey(StringEnum, 'unknown')).toBeNull();
  });

  it('should return the first member that matches the requested key.', () => {
    expect(Enum.getKey(IntEnum, 1)).toEqual('One');
    expect(Enum.getKey(StringEnum, 'foo')).toEqual('Foo');
  });
});

describe('hasKey()', () => {
  it('should return whether or not the provided key is a member of the enum.', () => {
    expect(Enum.hasKey(IntEnum, 'Eight')).toBeTrue();
    expect(Enum.hasKey(StringEnum, 'Baz')).toBeTrue();

    expect(Enum.hasKey(IntEnum, 'Unknown')).toBeFalse();
    expect(Enum.hasKey(StringEnum, 'Unknown')).toBeFalse();
  });
});

describe('getValues()', () => {
  it("should return all the members's values of the enum.", () => {
    expect(Enum.getValues(IntEnum)).toEqual([1, 2, 4, 8, 1]);
    expect(Enum.getValues(StringEnum)).toEqual(['foo', 'bar', 'baz', 'qux', 'foo']);
  });
});

describe('parse()', () => {
  it('should return null when the provided value is not a member of the enum.', () => {
    expect(Enum.parse(IntEnum, 32)).toBeNull();
    expect(Enum.parse(StringEnum, 'unknown')).toBeNull();
  });

  it('should return the parsed member of the enum.', () => {
    expect(Enum.parse(IntEnum, 2)).toEqual(2);
    expect(Enum.parse(StringEnum, 'qux')).toEqual('qux');
  });
});

describe('hasValue()', () => {
  it('should return whether or not the provided value is a member of the enum.', () => {
    expect(Enum.hasValue(IntEnum, 2)).toBeTrue();
    expect(Enum.hasValue(StringEnum, 'qux')).toBeTrue();

    expect(Enum.hasValue(IntEnum, 32)).toBeFalse();
    expect(Enum.hasValue(StringEnum, 'unknown')).toBeFalse();
  });
});

describe('getEntries()', () => {
  it('should return the entries of the enum.', () => {
    expect(Enum.getEntries(IntEnum)).toEqual([
      ['One', 1],
      ['Two', 2],
      ['Four', 4],
      ['Eight', 8],
      ['AnotherOne', 1],
    ]);

    expect(Enum.getEntries(StringEnum)).toEqual([
      ['Foo', 'foo'],
      ['Bar', 'bar'],
      ['Baz', 'baz'],
      ['Qux', 'qux'],
      ['AnotherFoo', 'foo'],
    ]);
  });
});
