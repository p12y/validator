# Validator

An unopinionated, declarative client side validator for HTML forms, with TypeScript support. Use built-in validators, or your own, custom validator with support for async validators.

## Demo

Run the demo project with parcel - `parcel demo.pug` and visit localhost:1234.

## Usage

The validator contructor takes two arguments, the root element that contains the input elements and a config object.

You can pass the names of the fields into the fields object and configure the types of validation for each input element. If the name contains special characters, wrap the key in parentheses.

You can use the callback function to make updates to the DOM, however you see fit. It uses the following signature:
`(field: HTMLInputElement, state: FormState, errors: string[]) => void;`

#### Example:

```ts
const validator = new Validator(document.querySelector("form"), {
  fields: {
    bsb: {
      validators: {
        notEmpty: {
          message: "You must enter a BSB",
          trim: true,
          input: true,
        },
        numeric: {
          message: "BSB must be numeric",
          input: true,
        },
        stringLength: {
          min: 6,
          max: 9,
          trim: true,
          message: "BSB should be between 6 and 9 characters",
          input: true,
        },
      },
      complete: fieldValidationCallback,
    },
    password: {
      validators: {
        notEmpty: {
          message: "You must enter a password",
          trim: false,
          input: true,
        },
        regexp: {
          regexp: /^password$/,
          message: 'Password should be "password"',
          input: true,
        },
        custom: {
          message: "Must be more than 2 characters",
          validatorFunction: (value) => value.length > 2,
          input: true,
        },
      },
      complete: fieldValidationCallback,
    },
    ["radio-example"]: {
      validators: {
        choice: {
          min: 1,
          message: "Select one",
          change: true,
        },
      },
      complete: fieldValidationCallback,
    },
    ["checkbox-example"]: {
      validators: {
        choice: {
          min: 2,
          max: 3,
          message: "Select between 2 & 3",
          change: true,
        },
      },
      complete: fieldValidationCallback,
    },
  },
  submitButton: document.querySelector("button"),
});
```
