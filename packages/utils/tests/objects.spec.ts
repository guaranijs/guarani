import { deepEquals, deepFreeze, removeNullishValues } from '../lib/objects'

describe('removeNullishValues()', () => {
  it('should remove all nullish values from an object', () => {
    expect(
      removeNullishValues({
        name: 'John Doe',
        occupation: null,
        age: 23,
        address: {
          streetAddress: '123 1st Avenue',
          referencePoint: null,
          owner: undefined,
          trees: ['Oak', null]
        },
        hobbies: [
          'Jogging',
          null,
          { name: 'Gambling', skills: ['Poker', 'Black Jack'] }
        ]
      })
    ).toEqual({
      name: 'John Doe',
      age: 23,
      address: { streetAddress: '123 1st Avenue', trees: ['Oak'] },
      hobbies: [
        'Jogging',
        { name: 'Gambling', skills: ['Poker', 'Black Jack'] }
      ]
    })
  })
})

describe('deepEquals()', () => {
  it('should succed when comparing two objects with sortArrays true.', () => {
    expect(
      deepEquals(
        { id: 1, name: ['John', 'Doe', { test: true }] },
        { name: ['Doe', 'John', { test: true }], id: 1 },
        { sortArrays: true }
      )
    ).toBe(true)
  })
})

describe('deepFreeze()', () => {
  it("should freeze a single object's properties.", () => {
    const data = { foo: 'foo', bar: { id: 1, name: 'bar' } }
    const frozenData = Object.freeze(data)

    // @ts-expect-error
    expect(() => (frozenData.foo = 'newFoo')).toThrow()

    frozenData.bar.name = 'newBar'

    expect(deepFreeze(frozenData)).toEqual(data)
  })

  it('should freeze the elements of an array of objects.', () => {
    const data = [
      { id: 1, name: 'obj1' },
      { id: 2, name: 'obj2' }
    ]
    const frozenData = Object.freeze(data)

    frozenData[0].id = 0
    frozenData[1].name = 'newObj2'

    // @ts-expect-error
    expect(() => (frozenData[3] = { id: 3, name: 'obj3' })).toThrow()

    expect(deepFreeze(frozenData)).toEqual(data)
  })
})
