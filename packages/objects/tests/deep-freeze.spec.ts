import { deepFreeze } from '../lib/deep-freeze';

describe('deepFreeze()', () => {
  it("should freeze a single object's properties.", () => {
    const data = deepFreeze({ foo: 'foo', bar: { id: 1, name: 'bar' } });

    // @ts-expect-error
    expect(() => (data.foo = 'newFoo')).toThrow();

    // @ts-expect-error
    expect(() => (data.bar.name = 'newBar')).toThrow();
  });

  it('should freeze the elements of an array of objects.', () => {
    const data = deepFreeze([
      { id: 1, name: 'obj1' },
      { id: 2, name: 'obj2' },
    ]);

    // @ts-expect-error
    expect(() => (data[0].id = 0)).toThrow();

    // @ts-expect-error
    expect(() => (data[1].name = 'newObj2')).toThrow();

    // @ts-expect-error
    expect(() => (data[3] = { id: 3, name: 'obj3' })).toThrow();
  });
});
