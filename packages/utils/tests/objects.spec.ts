import { equals, removeNullishValues } from '../lib/objects'

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

describe('equals()', () => {
  it('should succed when comparing two objects with sortArrays true.', () => {
    expect(
      equals(
        { id: 1, name: ['John', 'Doe', { test: true }] },
        { name: ['Doe', 'John', { test: true }], id: 1 },
        { sortArrays: true }
      )
    ).toBe(true)
  })
})
