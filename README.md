# Validator

An unopinionated, declarative client side validator for HTML forms, with TypeScript support.

## Demo

Run the example project with parcel - `parcel index.html` and visit localhost:1234.

## Usage

### Default mode

The validator contructor takes two arguments, the root element that contains the input elements and a config object.

You can pass the names of the fields into the fields object and configure the types of validation for each input element. If the name contains special characters, wrap the key in parentheses.

You can use the callback function to make updates to the DOM, however you see fit. It uses the following signature:
`(field: HTMLInputElement, errors: string[], isValid: boolean): any;`

#### Example:

```ts
const validator = new Validator(document.querySelector('.form'), {
  fields: {
    bsb: {
      validators: {
        notEmpty: {
          message: 'You must enter a BSB',
          trim: true
        },
        numeric: {
          message: 'BSB must be numeric'
        },
        stringLength: {
          min: 6,
          max: 9,
          trim: true,
          message: 'BSB should be between 6 and 9 characters'
        },
        callback: fieldValidationCallback
      }
    },
    password: {
      validators: {
        notEmpty: {
          message: 'You must enter a password',
          trim: false
        },
        regexp: {
          regexp: /^password$/,
          message: 'Password should be "password"'
        },
        custom: {
          message: 'Must be more than 2 characters',
          validatorFunction: value => value.length > 2
        },
        callback: fieldValidationCallback
      }
    },
    'radio-example': {
      validators: {
        choice: {
          min: 1,
          message: 'Select one'
        },
        callback: fieldValidationCallback
      }
    },
    'checkbox-example': {
      validators: {
        choice: {
          min: 2,
          max: 3,
          message: 'Select between 2 & 3'
        },
        callback: fieldValidationCallback
      }
    }
  },
  submitButton: document.querySelector('button'),
  onSubmit: (event, isValid) => {
    // Block form submit if invalid
    if (!isValid) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
});
```

### Declarative mode

You can omit the fields from the config object to use declarative mode. In this mode, you can add attributes to the elements you want to validate.

In declarative mode, the callback should be a string with a matching property as a function in the global scope.

#### Example:

```HTML
        <div class="form">
          <div class="form-field">
            <label>BSB number</label>
            <input
              type="text"
              id="bsbInput"
              name="bsb"
              data-vr-not-empty="true"
              data-vr-not-empty__message="You must enter a BSB"
              data-vr-numeric="true"
              data-vr-numeric__message="BSB must be numeric"
              data-vr-string-length="true"
              data-vr-string-length__min="6"
              data-vr-string-length__max="9"
              data-vr-string-length__trim="true"
              data-vr-string-length__message="BSB should be between 6 and 9 characters"
              data-vr-callback="fieldValidationCallback"
            />
          </div>

          <div class="form-field">
            <label>Password</label>
            <input
              type="text"
              id="password"
              name="password"
              data-vr-not-empty="true"
              data-vr-not-empty__message="You must enter a password"
              data-vr-callback="fieldValidationCallback"
            />
          </div>

          <div class="form-field">
            <button>Save</button>
          </div>
        </div>
```

```js
window.fieldValidationCallback = (field, errors, isValid) => isValid;

const validator = new Validator(document.querySelector('.form'), {
  declarative: true
});
```
