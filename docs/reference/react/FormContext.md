# FormContext API Reference

The React bindings for this library make use of the React Context API to provide a FormLogic instance to all child
components.

## FormContextType

This is the type of object that is provided by the context.
It extends the `FormLogic` class and adds React components that are bound to the form.
That way you can use the form components and get type-safety without the need to pass generic types around.

```ts
interface FormContextType<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
> extends FormLogic<TData, TAdapter> {
  FormProvider: (props: PropsWithChildren) => ReactNode
  FieldProvider: <
    TName extends Paths<TData>,
    TBoundData,
    TFieldAdapter extends ValidatorAdapter | undefined = undefined,
    TMixin extends readonly Exclude<Paths<TData>, TName>[] = never[],
  >(
    props: FieldProps<
      TData,
      TName,
      TBoundData,
      TFieldAdapter,
      TAdapter,
      TMixin
    >,
  ) => ReactNode
  FieldGroupProvider: <
    TMembers extends Paths<TData>[],
    TFieldGroupAdapter extends ValidatorAdapter | undefined = undefined,
    TFieldGroupMixin extends readonly ExcludeAll<
      Paths<TData>,
      TMembers
    >[] = never[],
  >(
    props: FieldGroupProps<
      TData,
      TMembers,
      TFieldGroupAdapter,
      TAdapter,
      TFieldGroupMixin
    >,
  ) => ReactNode
  handleSubmitOnEnter: ReturnType<typeof handleSubmitOnEnterForForm>
}
```

| Property              | Description                                                                                                                                             |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `FormProvider`        | A React component that provides the form to all child components.                                                                                       |
| `FieldProvider`       | A React component that creates a new field within the form and provides it to all child components.                                                     |
| `FieldGroupProvider`  | A React component that creates a new field group within the form and provides it to all child components.                                               |
| `handleSubmitOnEnter` | A function that can be used capture the enter key press on an HTML element, stop the events propagation and run the `handleSubmit` method of the form.  |

::: info
The `handleSubmitOnEnter` function can be useful for forms that lack a standard HTML form element, or for subforms within a larger HTML form. Since HTML forms cannot be nested, the browser's built-in functionality to submit on Enter won't work. To address this, use `handleSubmitOnEnter` on the container element that wraps your subform's elements.
:::

## formLogicToFormContext

This function is used to add the React components to a `FormLogic` instance.

```ts
declare function formLogicToFormContext<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
>(logic: FormLogic<TData, TAdapter>): FormContextType<TData, TAdapter>;
```

An example of the usage:

```tsx
import { FormLogic } from '@formsignals/form-react';

const logic = new FormLogic({
  defaultValues: {
    name: '',
    email: '',
  },
  onSubmit: (values) => {
    console.log(values);
  },
});

const form = formLogicToFormContext(logic);

export default function App() {
  return <form.FormProvider>...</form.FormProvider>;
}
```

## useFormContext

This hook is used to get the form context from the nearest `FormProvider` component.
You can pass in the required generic types to get type-safety.

```ts
declare function useFormContext<
  TData,
  TAdapter extends ValidatorAdapter | undefined = undefined,
>(): FormContextType<TData, TAdapter>;
```

::: warning
If used outside a `FormProvider` component, this hook will throw an error.
:::

An example of the usage:

```tsx
import { useFormContext } from '@formsignals/form-react';

type FormValues = {
  name: string;
  email: string;
};

function MyComponent() {
  const form = useFormContext<FormValues>();

  return (
    <div onKeyDown={form.handleSubmitOnEnter}>
      <form.FieldProvider name="name">
        {/* ... */}
      </form.FieldProvider>
    </div>
  );
}

export default function App() {
  const form = useForm<FormValues>()
  return (
    <form.FormProvider>
      <MyComponent />
    </form.FormProvider>
  )
}
```
