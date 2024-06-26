import { effect, signal } from '@preact/signals-core'
import { describe, expect, it, vi } from 'vitest'
import {
  ErrorTransformers,
  type ValidationErrorMap,
  type ValidatorEvents,
  clearErrorMap,
  validateWithValidators,
} from './validation'

describe('validation', () => {
  describe('validateWithValidators', () => {
    it('should not do anything when no validators are given', () => {
      const value = 'test'
      const event = 'onChange' as ValidatorEvents
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)

      validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )
      expect(errorMap.value).toEqual({})
    })
    it('should keep existing errors when no validators are given', () => {
      const value = 'test'
      const event = 'onChange' as ValidatorEvents
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({
        sync: 'error',
        syncErrorEvent: event,
      })
      const isValidating = signal(false)

      validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )
      expect(errorMap.value).toEqual({ sync: 'error', syncErrorEvent: event })
    })
    it('should validate a sync validator for a given event with a configured validator', () => {
      const value = 'test'
      const event = 'onSubmit' as ValidatorEvents
      const validate = vi.fn(() => 'error')
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)

      validateWithValidators(
        value,
        [],
        event,
        validate,
        {},
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )

      expect(validate).toHaveBeenCalledWith(value)
      expect(errorMap.value).toEqual({ sync: 'error', syncErrorEvent: event })
    })
    it('should stop validation on the first error when accumulateErrors is false', async () => {
      const value = 'test'
      const event = 'onChange' as ValidatorEvents
      const validatorSync = vi.fn(() => 'error')
      const validatorAsync = vi.fn(async () => 'error')
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)

      await validateWithValidators(
        value,
        [],
        event,
        validatorSync,
        undefined,
        validatorAsync,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )
      expect(validatorSync).toHaveBeenCalledWith(value)
      expect(validatorAsync).not.toHaveBeenCalled()
      expect(errorMap.value).toEqual({ sync: 'error', syncErrorEvent: event })
    })
    it('should accumulate validation errors when accumulateErrors is true', async () => {
      const value = 'test'
      const event = 'onChange' as ValidatorEvents
      const validatorSync = vi.fn(() => 'error')
      const validatorAsync = vi.fn(async () => 'error')
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)
      const accumulateErrors = true

      await validateWithValidators(
        value,
        [],
        event,
        validatorSync,
        undefined,
        validatorAsync,
        { accumulateErrors },
        asyncValidatorState,
        errorMap,
        isValidating,
      )
      expect(validatorSync).toHaveBeenCalledWith(value)
      expect(validatorAsync).toHaveBeenCalledWith(value, expect.anything())
      expect(errorMap.value).toEqual({
        sync: 'error',
        syncErrorEvent: event,
        async: 'error',
        asyncErrorEvent: event,
      })
    })
    it('should abort async validations if there was another validation before the promise resolved', async () => {
      vi.useFakeTimers()
      const value = 'test'
      const event = 'onChange' as ValidatorEvents
      const validate = vi.fn(() => 'error')
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const validator = async (_: unknown, signal: AbortSignal) => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        if (signal.aborted) return
        validate()
        return 'error'
      }
      const isValidating = signal(false)

      const promise = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validator,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )
      await vi.advanceTimersByTimeAsync(50)
      const promise2 = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validator,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )
      await vi.advanceTimersByTimeAsync(100)
      await Promise.all([promise, promise2])

      expect(validate).toHaveBeenCalledOnce()
      expect(errorMap.value).toEqual({ async: 'error', asyncErrorEvent: event })
      expect(asyncValidatorState.value).not.toBeUndefined()
      vi.useRealTimers()
    })
    it('should debounce the validation', async () => {
      vi.useFakeTimers()
      const value = 'test'
      const event = 'onChange' as ValidatorEvents
      const validate = vi.fn(() => 'error')
      const validator = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return 'error'
      }
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)

      const promise = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validator,
        {
          debounceMs: 100,
        },
        asyncValidatorState,
        errorMap,
        isValidating,
      )
      await vi.advanceTimersByTimeAsync(50)
      const promise2 = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validator,
        {
          debounceMs: 100,
        },
        asyncValidatorState,
        errorMap,
        isValidating,
      )
      await vi.advanceTimersByTimeAsync(200)
      await Promise.all([promise, promise2])

      expect(validate).not.toHaveBeenCalledTimes(1)
      expect(errorMap.value).toEqual({ async: 'error', asyncErrorEvent: event })

      vi.useRealTimers()
    })
    it('should forward mixins to the debounced validation', async () => {
      vi.useFakeTimers()
      const value = 'test'
      const event = 'onChange' as ValidatorEvents
      const validate = vi.fn()
      const validator = async (value: [string, ...number[]]) => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        validate(value)
        return 'error'
      }
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)
      const valueMixins = [1, 2, 3]

      const promise = validateWithValidators(
        value,
        valueMixins,
        event,
        undefined,
        undefined,
        validator,
        {
          debounceMs: 100,
        },
        asyncValidatorState,
        errorMap,
        isValidating,
        false,
      )
      await vi.advanceTimersByTimeAsync(200)
      await promise

      expect(validate).toHaveBeenCalledWith([value, ...valueMixins])

      vi.useRealTimers()
    })
    it('should ignore debounced validation if the validation was aborted before the debounce time', async () => {
      vi.useFakeTimers()
      const value = 'test'
      const event = 'onChange' as ValidatorEvents
      const validate = vi.fn(() => 'error')
      const validator = () => {
        validate()
        return 'error'
      }
      const asyncValidatorState = signal<AbortController | undefined>(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)

      const promise = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validator,
        {
          debounceMs: 100,
        },
        asyncValidatorState,
        errorMap,
        isValidating,
      )
      asyncValidatorState.value?.abort()
      await vi.advanceTimersByTimeAsync(200)
      await promise

      expect(validate).not.toHaveBeenCalled()
      expect(errorMap.value).toEqual({})
      vi.useRealTimers()
    })
    it('should abort debounce if the validation was aborted before the debounce time', async () => {
      vi.useFakeTimers()
      const value = 'test'
      const event = 'onChange' as ValidatorEvents
      const validate = vi.fn(() => 'error')
      const validator = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        validate()
        return 'error'
      }
      const asyncValidatorState = signal<AbortController | undefined>(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)

      const promise = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validator,
        {
          debounceMs: 100,
        },
        asyncValidatorState,
        errorMap,
        isValidating,
      )
      await vi.advanceTimersByTimeAsync(100)
      asyncValidatorState.value?.abort()
      await vi.advanceTimersByTimeAsync(100)
      await promise

      expect(validate).toHaveBeenCalled()
      expect(errorMap.value).toEqual({})
      vi.useRealTimers()
    })
    it.each([
      ['onChange', 'disableOnChangeValidation'],
      ['onBlur', 'disableOnBlurValidation'],
    ])(
      'should allow to disable event %s validation via option %s',
      (event, optionKey) => {
        const value = 'test'
        const validate = vi.fn(() => 'error')
        const validator = validate
        const asyncValidatorState = signal(undefined)
        const errorMap = signal<Partial<ValidationErrorMap>>({})
        const isValidating = signal(false)

        validateWithValidators(
          value,
          [],
          event as ValidatorEvents,
          validator,
          {
            [optionKey]: true,
          },
          undefined,
          undefined,
          asyncValidatorState,
          errorMap,
          isValidating,
        )

        expect(validate).not.toHaveBeenCalled()
        expect(errorMap.value).toEqual({})
      },
    )
    it('should allow to enable validation on mount', () => {
      const value = 'test'
      const validate = vi.fn(() => 'error')
      const validator = validate
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)

      validateWithValidators(
        value,
        [],
        'onMount',
        validator,
        {
          validateOnMount: true,
        },
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )

      expect(validate).toHaveBeenCalled()
      expect(errorMap.value).toEqual({
        sync: 'error',
        syncErrorEvent: 'onMount',
      })
    })
    it("should set the validation state while running async validation and reset it when it's done", async () => {
      vi.useFakeTimers()
      const value = 'test'
      const event = 'onChange' as ValidatorEvents
      const validator = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return 'error'
      })
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)

      const promise = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validator,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )
      expect(isValidating.value).toBe(true)
      await vi.advanceTimersByTimeAsync(100)
      await promise
      expect(isValidating.value).toBe(false)
      vi.useRealTimers()
    })
    it('should not reset the validation state when aborting async validation', async () => {
      // The reasoning behind this is, that the aborting of a signal is followed by a new validation
      vi.useFakeTimers()
      const value = 'test'
      const event = 'onChange' as ValidatorEvents
      const validator = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return 'error'
      })
      const asyncValidatorState = signal<AbortController | undefined>(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)

      const promise = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validator,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )
      expect(isValidating.value).toBe(true)
      asyncValidatorState.value?.abort()
      await vi.advanceTimersByTimeAsync(100)
      await promise
      expect(isValidating.value).toBe(true)
      vi.useRealTimers()
    })
    it('should not validate mount events when validator is unconfigured (a function)', () => {
      const value = 'test'
      const validator = vi.fn(() => 'error')
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)

      validateWithValidators(
        value,
        [],
        'onMount',
        validator,
        undefined,
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )

      expect(validator).not.toHaveBeenCalled()
      expect(errorMap.value).toEqual({})
    })
    it('should only update sync errors if they have changed', () => {
      const value = 'test'
      const validator = vi.fn(() => 'error')
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({
        sync: 'error',
        syncErrorEvent: 'onChange',
      })
      const isValidating = signal(false)

      const changedFn = vi.fn()
      effect(() => {
        changedFn(errorMap.value)
      })
      expect(changedFn).toHaveBeenCalledTimes(1)

      validateWithValidators(
        value,
        [],
        'onChange',
        validator,
        undefined,
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )

      expect(errorMap.value).toEqual({
        sync: 'error',
        syncErrorEvent: 'onChange',
      })
      expect(changedFn).toHaveBeenCalledTimes(1)

      validateWithValidators(
        value,
        [],
        'onSubmit',
        validator,
        undefined,
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )

      expect(errorMap.value).toEqual({
        sync: 'error',
        syncErrorEvent: 'onSubmit',
      })
      expect(changedFn).toHaveBeenCalledTimes(2)
    })
    it('should only update async errors if they have changed', async () => {
      const value = 'test'
      const validator = vi.fn(async () => 'error')
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({
        async: 'error',
        asyncErrorEvent: 'onChange',
      })
      const isValidating = signal(false)

      const changedFn = vi.fn()
      effect(() => {
        changedFn(errorMap.value)
      })
      expect(changedFn).toHaveBeenCalledTimes(1)

      await validateWithValidators(
        value,
        [],
        'onChange',
        undefined,
        undefined,
        validator,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )

      expect(errorMap.value).toEqual({
        async: 'error',
        asyncErrorEvent: 'onChange',
      })
      expect(changedFn).toHaveBeenCalledTimes(1)

      await validateWithValidators(
        value,
        [],
        'onSubmit',
        undefined,
        undefined,
        validator,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
      )

      expect(errorMap.value).toEqual({
        async: 'error',
        asyncErrorEvent: 'onSubmit',
      })
      expect(changedFn).toHaveBeenCalledTimes(2)
    })
    it('should only run onChange validation if the field was touched before if configured', () => {
      const value = 'test'
      const validate = vi.fn(() => 'error')
      const validator = validate
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)

      validateWithValidators(
        value,
        [],
        'onChange',
        validator,
        {
          validateOnChangeIfTouched: true,
        },
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        false,
      )

      expect(validate).not.toHaveBeenCalled()
      expect(errorMap.value).toEqual({})

      validateWithValidators(
        value,
        [],
        'onChange',
        validator,
        {
          validateOnChangeIfTouched: true,
        },
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        true,
      )

      expect(validate).toHaveBeenCalled()
      expect(errorMap.value).toEqual({
        sync: 'error',
        syncErrorEvent: 'onChange',
      })
    })
    it('should not run onChange validation even after touch if the onChange validation is disabled completely', () => {
      const value = 'test'
      const validate = vi.fn(() => 'error')
      const validator = validate
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)

      validateWithValidators(
        value,

        [],
        'onChange',
        validator,
        {
          disableOnChangeValidation: true,
          validateOnChangeIfTouched: true,
        },
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        false,
      )

      expect(validate).not.toHaveBeenCalled()
      expect(errorMap.value).toEqual({})

      validateWithValidators(
        value,

        [],
        'onChange',
        validator,
        {
          disableOnChangeValidation: true,
          validateOnChangeIfTouched: true,
        },
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        true,
      )

      expect(validate).not.toHaveBeenCalled()
      expect(errorMap.value).toEqual({})
    })
    it('should validate with value mixins', () => {
      const value = 'test'
      const validate = vi.fn(() => 'error')
      const validator = validate
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)
      const valueMixins = [1, 2, 3]

      validateWithValidators(
        value,
        valueMixins,
        'onChange',
        validator,
        undefined,
        undefined,
        undefined,
        asyncValidatorState,
        errorMap,
        isValidating,
        false,
      )

      expect(validate).toHaveBeenCalledWith([value, ...valueMixins])
    })
    it("should ignore debounce for 'onSubmit' events", async () => {
      vi.useFakeTimers()
      const value = 'test'
      const event = 'onSubmit' as ValidatorEvents
      const validate = vi.fn(async () => 'error')
      const asyncValidatorState = signal(undefined)
      const errorMap = signal<Partial<ValidationErrorMap>>({})
      const isValidating = signal(false)

      const promise = validateWithValidators(
        value,
        [],
        event,
        undefined,
        undefined,
        validate,
        {
          debounceMs: 100,
        },
        asyncValidatorState,
        errorMap,
        isValidating,
      )
      await promise

      expect(validate).toHaveBeenCalled()
      expect(errorMap.value).toEqual({
        async: 'error',
        asyncErrorEvent: event,
      })

      vi.useRealTimers()
    })
  })

  describe('clearSubmitEventErrors', () => {
    it('should clear the sync error', () => {
      const errorMap = signal<Partial<ValidationErrorMap>>({
        sync: 'error',
        syncErrorEvent: 'onSubmit',
      })

      clearErrorMap(errorMap)

      expect(errorMap.value).toEqual({
        sync: undefined,
        syncErrorEvent: undefined,
      })
    })
    it('should clear the async error', () => {
      const errorMap = signal<Partial<ValidationErrorMap>>({
        async: 'error',
        asyncErrorEvent: 'onSubmit',
      })

      clearErrorMap(errorMap)

      expect(errorMap.value).toEqual({
        async: undefined,
        asyncErrorEvent: undefined,
      })
    })
    it('should clear both errors', () => {
      const errorMap = signal<Partial<ValidationErrorMap>>({
        sync: 'error',
        syncErrorEvent: 'onSubmit',
        async: 'error',
        asyncErrorEvent: 'onSubmit',
      })

      clearErrorMap(errorMap)

      expect(errorMap.value).toEqual({
        sync: undefined,
        syncErrorEvent: undefined,
        async: undefined,
        asyncErrorEvent: undefined,
      })
    })
  })

  describe('ErrorTransformers', () => {
    it('should transform Zod errors to an error map', () => {
      const zodError = {
        issues: [
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'number',
            path: ['names', 1],
            message: 'Invalid input: expected string, received number',
          },
          {
            code: 'unrecognized_keys',
            keys: ['extra'],
            path: ['address'],
            message: "Unrecognized key(s) in object: 'extra'",
          },
          {
            code: 'too_small',
            minimum: 10000,
            type: 'number',
            inclusive: true,
            path: ['address', 'zipCode'],
            message: 'Value should be greater than or equal to 10000',
          },
        ],
      }

      const transformed = ErrorTransformers.zod(zodError.issues)

      expect(transformed).toEqual({
        'names.1': 'Invalid input: expected string, received number',
        address: "Unrecognized key(s) in object: 'extra'",
        'address.zipCode': 'Value should be greater than or equal to 10000',
      })
    })
  })
})
