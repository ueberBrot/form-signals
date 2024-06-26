# Basic Usage

::: info
Please read through the [Core Basic Usage](/guide/basic-usage) guide before continuing.
It explains the basic concepts of the library, this section will focus on showing how to use the React bindings.
:::

Let's start by creating a simple form, note that it can take the same options as explained in the core section.

```tsx
import {useForm} from "@formsignals/form-react";

type FormValues = {
  name: string;
}

export default function MyForm() {
  const form = useForm<FormValues>();

  return (
    <form.FormProvider>
      {/* Your form fields here */}
    </form.FormProvider>
  )
}
```

::: warning
This library makes heavy use of the React Context API.
So make sure, that you use the `FormProvider` component to wrap your form fields.
:::

## Adding Fields

There are two ways to add fields to the form.
You can either use the `useField` hook or the `FieldProvider` component.

### Using the `useField` hook

Under the hood, the `useField` hook is using the `form.getOrCreateField` method from the core library,
therefore, the same options apply.

```tsx {5,9-14}
import {useField} from "@formsignals/form-react";

export default function MyForm() {
  const form = useForm<FormValues>();
  const nameField = useField(form, "name");

  return (
    <form.FormProvider>
      <nameField.FieldProvider>
        <input
          value={nameField.data.value}
          onChange={(e) => nameField.handleChange(e.target.value)}
        />
      </nameField.FieldProvider>
    </form.FormProvider>
  )
}
```

::: tip
To optimize re-renders, create a custom `input` component that receives the field signal as a prop. Using `nameField.data.value` directly in the main component triggers a full re-render on every change.
:::

::: info
The use of the `nameField.FieldProvider` is optional in this case since the field context is not consumed by any other
component.
It is still recommended to use it to keep the code consistent.
:::

### Using the `FieldProvider` component

```tsx {1,8-12}
import {InputSignal} from "./InputSignal";

export default function MyForm() {
  const form = useForm<FormValues>();

  return (
    <form.FormProvider>
      <form.FieldProvider name="name">
        {(field) => (
          <InputSignal value={field.data}/>
        )}
      </form.FieldProvider>
    </form.FormProvider>
  )
}
```

::: danger WARNING
You cannot subscribe to a signal value within an arrow function.
This means using `field.data.value` directly in the main component is not possible.
To access the signal value, you'll need to create a child component that subscribes to the signal.
:::

If you want to avoid this pitfall, you can use the `FieldProvider` component and consume the fields context in a child
component.

```tsx {1-2,4-9,16-18}
import {InputSignal} from "./InputSignal";
import {useFieldContext} from "@formsignals/form-react";

function NameInput() {
  const field = useFieldContext<FormValues, "name">()
  return (
    <InputSignal value={field.data}/>
  )
}

export default function MyForm() {
  const form = useForm<FormValues>();

  return (
    <form.FormProvider>
      <form.FieldProvider name="name">
        <NameInput/>
      </form.FieldProvider>
    </form.FormProvider>
  )
}
```

## Form Submission

The basic principles of form submission are the same as in the core library.

It is recommended to use a default HTML `form` element to wrap your form and hook into the `onSubmit` event.

```tsx {10-13,17-18}
export default function MyForm() {
  const form = useForm<FormValues>({
    onSubmit: (values) => {
      console.log(values);
    }
  });

  return (
    <form.FormProvider>
      <form onSubmit={event => {
        event.preventDefault();
        form.handleSubmit();
      }}>
        <form.FieldProvider name="name">
          <NameInput/>
        </form.FieldProvider>
        <button type="submit" onClick={handleSubmit}>Submit</button>
      </form>
    </form.FormProvider>
  )
}
```

## Accessing Data

The basic principles of accessing data are the same as in the core library.

Additionally, you can always use the `useFormContext` and `useFieldContext` hooks to access form and field data directly.

::: info
You can only use these hooks from children of the `FormProvider` or `FieldProvider` components.
:::

## Add Validation

The basic principles of adding validation are the same as in the core library.

So adding validation to a field is as simple as adding the `validator` option to the field.

```tsx {8}
export default function MyForm() {
  const form = useForm<FormValues>();

  return (
    <form.FormProvider>
      <form.FieldProvider
        name="name"
        validator={(value) => value.length <= 3 && "Name must be at least 3 characters long"}
      >
        <NameInput/>
      </form.FieldProvider>
    </form.FormProvider>
  )
}
```

## Add Transformation

The basic principles of transforming data are the same as in the core library. To add a transformation to a field, use the `transformFromBinding` and `transformToBinding` options. You can then access the transformed data using the `transformedData` property of the field.

```tsx {8-9,12}
export default function MyForm() {
  const form = useForm<FormValues>();

  return (
    <form.FormProvider>
      <form.FieldProvider
        name="age"
        transformFromBinding={(value) => parseInt(value)}
        transformToBinding={(value) => value.toString()}
      >
        {(field) => (
          <InputSignal value={field.transformedData}/>
        )}
      </form.FieldProvider>
    </form.FormProvider>
  )
}
```

## Dynamic Fields

Once a field is created, it will be automatically mounted with the provided name and options.
If the component is unmounted, so will the field.
By default, this will keep all the state of this field.
If you want to remove the values of the field, you can use the `removeValueOnUnmount` option, which will reset the state and remove values of a field once it unmounts.

```tsx {10}
export default function MyForm() {
  const form = useForm<FormValues>();
  const [showAge, setShowAge] = useState(true);

  return (
    <form.FormProvider>
      {showAge && (
        <form.FieldProvider
          name="age"
          removeValueOnUnmount
        >
          {(field) => (
            <InputSignal value={field.data}/>
          )}
        </form.FieldProvider>
      )}
    </form.FormProvider>
  )
}
```

You can also create dynamic fields, where the name of the field might change.
This library handles a change in the field name by unmounting the old field and mounting a new one.
Changes to the field options will also be applied as soon as the field props update.

```tsx {3,8-9}
export default function MyForm() {
  const form = useForm<FormValues>();
  const [fieldName, setFieldName] = useState("age");

  return (
    <form.FormProvider>
      <form.FieldProvider name={fieldName}>
        {(field) => (
          <InputSignal value={field.data}/>
        )}
      </form.FieldProvider>
      <button onClick={() => setFieldName("name")}>Change Field</button>
    </form.FormProvider>
  )
}
```

::: warning
Using the `removeValueOnUnmount` option, might cause some unexpected issues, so be careful using this.
:::

## Tips

React is not optimized for signals,
so it is recommended to use some helpers to improve your experience and use the best performance offered by signals.

### Create a `InputSignal` component

This component will subscribe to the signal and update the input value.
That way, you can avoid unnecessary re-renders of parent components.

```tsx
import {Signal} from "@preact/signals-react";

interface InputSignalProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: Signal<string>;
}

export function InputSignal({value, ...props}: InputSignalProps) {
  return <input {...props} value={value.value} onChange={(e) => value.value = e.target.value}/>
}
```

This concept can be applied to any input component you want to use.

### Create a `ErrorText` component

This component will subscribe to errors of any field through the field context.

```tsx
import {useFieldContext} from "@formsignals/form-react";

export function ErrorText() {
  const field = useFieldContext();
  if (field.isValid.value) return null;
  return <span>{field.errors.value.join(", ")}</span>
}
```

You can apply the style you want to the error message in this component.
