import { Enum } from '../lib/enum';

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

describe('Enum utilities', () => {
  it("should return all the members' keys of the Enum.", () => {
    expect(Enum.keys(IntEnum)).toEqual(['One', 'Two', 'Four', 'Eight', 'AnotherOne']);
    expect(Enum.keys(StringEnum)).toEqual(['Foo', 'Bar', 'Baz', 'Qux', 'AnotherFoo']);
  });

  it('should return "undefined" when the provided key is not a member of the Enum.', () => {
    expect(Enum.key(IntEnum, 3)).toBeUndefined();
    expect(Enum.key(StringEnum, 'unknown')).toBeUndefined();
  });

  it('should return the first member that matches the requested key.', () => {
    expect(Enum.key(IntEnum, 1)).toBe('One');
    expect(Enum.key(StringEnum, 'foo')).toBe('Foo');
  });

  it('should return whether or not the provided key is a member of the Enum.', () => {
    expect(Enum.hasKey(IntEnum, 'Eight')).toBe(true);
    expect(Enum.hasKey(StringEnum, 'Baz')).toBe(true);

    expect(Enum.hasKey(IntEnum, 'Unknown')).toBe(false);
    expect(Enum.hasKey(StringEnum, 'Unknown')).toBe(false);
  });

  it("should return all the members's values of the Enum.", () => {
    expect(Enum.values(IntEnum)).toEqual([1, 2, 4, 8, 1]);
    expect(Enum.values(StringEnum)).toEqual(['foo', 'bar', 'baz', 'qux', 'foo']);
  });

  it('should return "undefined" when the provided value is not a member of the Enum.', () => {
    expect(Enum.parse(IntEnum, 32)).toBeUndefined();
    expect(Enum.parse(StringEnum, 'unknown')).toBeUndefined();
  });

  it('should return the parsed member of the Enum.', () => {
    expect(Enum.parse(IntEnum, 2)).toBe(2);
    expect(Enum.parse(StringEnum, 'qux')).toBe('qux');
  });

  it('should return whether or not the provided value is a member of the Enum.', () => {
    expect(Enum.hasValue(IntEnum, 2)).toBe(true);
    expect(Enum.hasValue(StringEnum, 'qux')).toBe(true);

    expect(Enum.hasValue(IntEnum, 32)).toBe(false);
    expect(Enum.hasValue(StringEnum, 'unknown')).toBe(false);
  });

  it('should return the entries of the Enum.', () => {
    expect(Enum.entries(IntEnum)).toEqual([
      ['One', 1],
      ['Two', 2],
      ['Four', 4],
      ['Eight', 8],
      ['AnotherOne', 1],
    ]);

    expect(Enum.entries(StringEnum)).toEqual([
      ['Foo', 'foo'],
      ['Bar', 'bar'],
      ['Baz', 'baz'],
      ['Qux', 'qux'],
      ['AnotherFoo', 'foo'],
    ]);
  });
});
