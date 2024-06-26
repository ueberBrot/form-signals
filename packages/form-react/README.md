<img src="https://github.com/gutentag2012/form-signals/raw/main/assets/repo-banner-light.svg" alt="Signal Form Banner" width="100%">

[![form-react-version](https://img.shields.io/npm/v/%40formsignals%2Fform-react?style=for-the-badge&logo=npm&label=form-react)](https://www.npmjs.com/package/@formsignals/form-react)
![form-react-bundle](https://img.shields.io/bundlephobia/minzip/%40formsignals%2Fform-react?style=for-the-badge&label=form-react-size)

The React bindings for form management with Preact Signals.

## Features

- **TypeScript** - Written in TypeScript with full type support for optimal DX.
- **Reactivity** - Reactivity without abstractions thanks to Preact Signals.
- **Validation** - Built-in validation support, including adapters for validation schema libraries.
- **Transformations** - Transform values for the specific needs of your input fields.
- **Field Groups** - Group fields together to manage parts of a form independently.
- **Async Data** - Easily manage async initialisation, validation and submission.
- **Arrays + Dynamic Objects** - Utilize arrays and dynamic objects within your forms.
- **React** - React bindings for easy integration with React.
- **Dev Tools** - Offers a dev tools component to debug your forms.

## Install

```bash
npm install @formsignals/form-react
```

If you have not installed signals, you will need to install it as well:

```bash
npm install @preact/signals-react
```

If you are having trouble installing the Preact Signals, please consult their documentation.

## Quickstart

Create a new form instance:

```tsx
const form = useForm({
  defaultValues: {
    name: '',
    email: '',
  },
});
```

Then create a field component and configure it:

```tsx
<form.FieldProvider name="name" validate={(value) => {
  if (!value) {
    return 'Name is required';
  }
}}>
  {(field) => (
    <InputSignal signal={field.data} label="Name" />
  )}
</form.FieldProvider>
```

Note that the `InputSignal` component takes a `signal` prop, which is the signal from the field.
Internally, the component then subscribes to the changes.
Due to limitations of signals, it is not possible to directly subscribe to the signal within the child arrow function.

You can also access the field context from children of the `FieldProvider`:

```tsx
const field = useFieldContext();
```
