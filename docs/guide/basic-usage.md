# Basic Usage

Since the library is centered around forms, let's start by creating a simple form.

```ts
import {FormLogic} from "@formsignals/form-core";

type FormValues = {
  name: string;
}

const form = new FormLogic<FormValues>()
```

::: info
We are passing a type parameter to `FormLogic` to define the shape of the form values.
If you would not do this step Typescript would not allow you to add any fields to the form.
:::

::: tip
If you pass default values to the form, you do not have to pass in an explicit type parameter.

```ts
const form = new FormLogic({
  name: "John Doe"
})
```

:::

## Adding Fields

The form is now with no fields. Let's add a field to it.

```ts
const field = form.getOrCreateField("name")
```

Before we can use the field, we need to mount it together with the form.

```ts
form.mount()
field.mount()
```

::: info
You will not be able to use the field handlers or validation without mounting it.
It is, however, still possible to work directly with the field signal data.
:::

Now you can handle changes to the form field through the handler function or directly through the signal.

```ts
// Using the handler
field.handleChange("New Name")
// Using the signal
field.data.value = "New Name"
```

## Form Submission

A form is not complete without a submit-handler.
To add one, add the onSubmit method to the form options.

```ts
const form = new FormLogic<FormValues>({
  onSubmit: (values) => {
    console.log(values)
  }
})
```

::: info
The values passed to the onSubmit method are the current form values extracted from their signals.
Therefore, they are the same as `form.json.value` at that point in time.
:::

Now whenever you call the forms `handleSubmit` method, the onSubmit method will be called, **as long as the form is
valid**.

```ts
form.handleSubmit()
```

## Accessing Data

There are several different ways to access the form data.
Your choice will depend on the use case.

### Through Fields

Typically, you will access the form data through the `data` property of a field.
This will give you access to the signal data object, meaning you can use default signal methods such as `computed`
or `effect`.

```ts
import {computed, effect} from "@preact/signals-core";

const name = field.data.value
const nameUpperCase = computed(() => name.toUpperCase())

effect(() => {
  console.log(nameUpperCase.value)
})
```

::: warning
If your field value is not a primitive, but rather an object or an array,
the children of `field.data` will also be signals deep down.
For that reason, you would have to access a deeply nested value like this:

(Be aware that you can replace the `.peek()` with a `.value` at any depth)

```ts
type FieldData = {
  names: Array<{
    first: string
  }>
}
const name = field.data.peek().names.peek()[0].data.peek().first.peek()
```

If you are confused why it is `[0].data.peek()` and not `[0].peek()`,
then read up on the [Array Concept](/guide/concepts#arrays) or have a look at the [Array Guides](/guide/array-fields).
:::

### Through Form Date

If you do not have a field for the data you want to access,
or you cannot reach the field from where you are, you can access the form data directly.
As mentioned before, the form data is a deep signal object, meaning you can use the same methods as with the field data.

```ts
const name = form.data.peek().name.value
const nameUpperCase = computed(() => name.toUpperCase())

effect(() => {
  console.log(nameUpperCase.value)
})
```

### Through Form JSON

If you are not interested in the signal data and fine-grained reactivity you can simple access the form data through
the `json` property.
This will always give you the up-to-date form data as a plain object.

```ts
const name = form.json.value.name
```

::: info
The `json` property is a signal itself, meaning if you use the `.value`-way of accessing the data,
you will subscribe to every change within the form data.
:::

## Add Validation

A crucial part of forms is validation.
You can either add validation to the whole form or to a single field.

### Field Validation

Adding validation to a single field might be the simplest and most common way to validate a form.
You can add a validation function to the field options.

```ts
const field = form.getOrCreateField("name", {
  validator: (value) => {
    if (value.length < 3) {
      return "Name must be at least 3 characters long"
    }
  }
})
```

Errors are returned as strings, meaning you only return a string if the validation fails,
otherwise you can return nothing.

By default, validation will be run when:

1. The field value changes
2. The field is blurred
3. The form is submitted

You can customize this behavior by passing `validatorOptions` option to the field.

```ts
const field = form.getOrCreateField("name", {
  validator: (value) => {
    if (value.length < 3) {
      return "Name must be at least 3 characters long"
    }
  },
  validatorOptions: {
    // Run validation once the field is mounte
    validateOnMount: true,
    // Do not run validation on change
    disableOnChangeValidation: true,
    // Do not run validation on blur
    disableOnBlurValidation: true,
    // Only run the onChange validation if the field was touched
    validateOnChangeIfTouched: true,
  }
})
```

### Form Validation

If you want to validate the whole form, you can add a validation function to the form options.

```ts
const form = new FormLogic<FormValues>({
  validator: (values) => {
    if (values.name.length < 3) {
      return {
        name: "Name must be at least 3 characters long"
      }
    }
  }
})
```

::: tip
It is recommended to use field validation whenever possible, since it is more readable and easier to maintain.
:::

::: info
The validatorOptions available for fields are also available for the form.
:::

### Advanced Usage

For more advanced usages like async validation, cross-field validation or using a schema validation library,
please refer to the [Validation Guide](/guide/validation).

## Add Transformation

In many cases, you have data in your form that has a type which cannot be used by your application.
A common example is numbers, which are stored as such in the form,
but are needed as string in the application (e.g., in an input field).
The users of the transformed values are called bindings in this context.

To address this, you can add a transformation function to the field options.
There are two different transformation functions you can add to a field:

| Function               | Description                                                                    |
|------------------------|--------------------------------------------------------------------------------|
| `transformFromBinding` | This function is used to transform the value from the bound input to the form. |
| `transformToBinding`   | This function is used to transform the value from the form to the bound input. |

```ts
const field = form.getOrCreateField("age", {
  transformFromBinding: (value) => {
    return parseInt(value)
  },
  transformToBinding: (value) => {
    return value.toString()
  }
})
```

To access the transformed value, you can use the `transformedData` property of the field.

```ts
const age = field.transformedData.value
console.log(typeof age) // string
```

If you want to change the value of the field, you can do so through the `transformedData` property as well or use
the `handleChangeBound`.
These will set the value of the form by running the passed value through the `transformFromBinding` function first.

```ts
field.transformedData.value = "42"
field.handleChangeBound("42")

console.log(field.data.value) // 42
console.log(typeof field.data.value) // number
```