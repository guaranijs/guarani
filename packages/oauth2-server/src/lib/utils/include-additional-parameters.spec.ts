import { includeAdditionalParameters } from './include-additional-parameters';

describe('includeAdditionalParameters()', () => {
  it('should add parameters to the provided object.', () => {
    const obj = { foo: 'foo', bar: 'bar' };
    const augmentedObj = includeAdditionalParameters(obj, { baz: 'baz' });

    expect(obj).toStrictEqual({ foo: 'foo', bar: 'bar', baz: 'baz' });
    expect(augmentedObj).toStrictEqual({ foo: 'foo', bar: 'bar', baz: 'baz' });
  });
});
