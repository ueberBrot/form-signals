import { describe, expect, it } from 'vitest'
import { getLeftUnequalPaths, isEqualDeep } from './equality.utils'

const fileA = new File([''], 'fileA')
const fileB = new File([''], 'fileB')

describe('equality.utils', () => {
  describe('isEqualDeep', () => {
    it.each([
      [1, 1],
      [null, null],
      [undefined, undefined],
      [new Date(0), new Date(0)],
      [fileA, fileA],
      [{}, {}],
      [{ a: 1 }, { a: 1 }],
      [
        { a: 1, b: { c: 2 } },
        { a: 1, b: { c: 2 } },
      ],
      [
        { nestedArray: [1, undefined, null, new Date(0)] },
        { nestedArray: [1, undefined, null, new Date(0)] },
      ],
    ])(
      'should return true when a and b are equal for values %j and %j',
      (a, b) => {
        expect(isEqualDeep(a, b)).toBe(true)
      },
    )
    it.each([
      [1, 2],
      [null, undefined],
      [undefined, null],
      [new Date(0), new Date(1)],
      [fileA, fileB],
      [{}, { a: 1 }],
      [{ a: 1 }, { a: 2 }],
      [{ a: 1 }, { aa: 1 }],
      [
        { a: 1, b: { c: 2 } },
        { a: 1, b: { c: 3 } },
      ],
      [
        { nestedArray: [1, undefined, null, new Date()] },
        { nestedArray: [1, undefined, null, new Date(1)] },
      ],
    ])(
      'should return false when a and b are not equal for values %j and %j',
      (a, b) => {
        expect(isEqualDeep(a, b)).toBe(false)
      },
    )
  })

  describe('getLeftUnequalPaths', () => {
    it.each([
      [1, 1],
      [null, null],
      [undefined, undefined],
      [new Date(0), new Date(0)],
      [fileA, fileA],
      [{}, {}],
      [{ a: 1 }, { a: 1 }],
      [
        { nestedArray: [1, undefined, null, new Date(0)] },
        { nestedArray: [1, undefined, null, new Date(0)] },
      ],
    ])(
      'should return empty array when a and b are equal for values %j and %j',
      (a, b) => {
        expect(getLeftUnequalPaths(a, b)).toEqual([])
      },
    )
    it.each([
      [1, 2, ['']],
      [null, undefined, ['']],
      [undefined, null, ['']],
      [new Date(0), new Date(1), ['']],
      [fileA, fileB, ['']],
      [{ a: 1 }, { a: 2 }, ['a']],
      [{ a: 1 }, { aa: 1 }, ['a']],
      [{ a: 1, b: { c: 2 } }, { a: 1, b: { c: 3 } }, ['b.c']],
      [
        {
          nestedArray: [
            1,
            undefined,
            null,
            new Date(),
            { deeply: { nested: ['object', 'missing'] } },
            fileA,
          ],
        },
        {
          nestedArray: [
            1,
            undefined,
            null,
            new Date(1),
            { deeply: { nested: ['objectt'] } },
            fileB,
          ],
        },
        [
          'nestedArray.3',
          'nestedArray.4.deeply.nested',
          'nestedArray.4.deeply.nested.0',
          'nestedArray.4.deeply.nested.1',
          'nestedArray.5',
        ],
      ],
    ])(
      'should return array of paths when a and b are not equal for values %j and %j',
      (a, b, expected) => {
        expect(getLeftUnequalPaths(a, b)).toEqual(expected)
      },
    )
  })
})
