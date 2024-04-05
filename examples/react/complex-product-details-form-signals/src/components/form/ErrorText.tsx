import { useFieldContext } from '@formsignals/form-react'

/**
 * @useSignals
 */
export const ErrorText = () => {
  const field = useFieldContext()
  if (!field.isValid.value) return null
  return (
    <p className="text-[0.8rem] font-medium text-destructive">
      {field.errors.value.join(', ')}
    </p>
  )
}