import { ErrorText } from '@/components/ErrorText.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { InputForm } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { type FormValues, MAX_STEPS } from '@/types.ts'
import { useFieldGroupContext } from '@formsignals/form-react'
import type { ZodAdapter } from '@formsignals/validation-adapter-zod'
import type { Signal } from '@preact/signals-react'
import { z } from 'zod'

export type PersonalStepProps = {
  step: number
  currentStep: Signal<number>
}

export const AccountStep = (props: PersonalStepProps) => {
  const group = useFieldGroupContext<
    FormValues,
    ['username', 'password', 'confirmPassword'],
    undefined,
    typeof ZodAdapter
  >()
  if (props.step !== props.currentStep.value) return null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void group.handleSubmit()
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>

        <CardContent>
          <group.FieldProvider
            name="username"
            validator={z.string().min(3)}
            validatorOptions={{ validateOnChangeIfTouched: true }}
          >
            <div className="flex-1">
              <Label>Username</Label>
              <InputForm placeholder="Type here..." />
              <ErrorText />
            </div>
          </group.FieldProvider>
          <group.FieldProvider
            name="password"
            validator={z.string().min(8)}
            validatorOptions={{ validateOnChangeIfTouched: true }}
          >
            <div className="flex-1">
              <Label>Password</Label>
              <InputForm placeholder="Type here..." type="password" />
              <ErrorText />
            </div>
          </group.FieldProvider>
          <group.FieldProvider
            name="confirmPassword"
            validator={([pass, confirmPass]) =>
              pass !== confirmPass && "Passwords don't match"
            }
            validateMixin={['password']}
            validatorOptions={{ validateOnChangeIfTouched: true }}
          >
            <div className="flex-1">
              <Label>Confirm Password</Label>
              <InputForm placeholder="Type here..." type="password" />
              <ErrorText />
            </div>
          </group.FieldProvider>
        </CardContent>

        <CardFooter className="justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={props.step === 1}
            onClick={() => props.currentStep.value--}
          >
            Previous
          </Button>
          <div className="flex flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                props.currentStep.value++
              }}
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={!group.canSubmit.value || props.step === MAX_STEPS}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}
