import Validator from './validator';

declare global {
  interface Window {
    fieldValidationCallback: (
      field: HTMLInputElement,
      errors: string[],
      isValid: boolean
    ) => void;
  }
}

const fieldValidationCallback = (
  field: HTMLInputElement,
  errors: string[],
  isValid: boolean
) => {
  const containerEl = field.closest('.form-field');
  const messageContainer = containerEl.querySelector('.message');
  containerEl.classList.remove('has-error');

  messageContainer.innerHTML = '';

  if (!isValid) {
    containerEl.classList.add('has-error');
  }

  errors.forEach(message => {
    const errorText = document.createElement('span');
    errorText.className = 'error-text';
    errorText.innerText = message;

    messageContainer.appendChild(errorText);
  });
};

window.fieldValidationCallback = fieldValidationCallback;

const validator = new Validator(document.querySelector('.form'), {
  fields: {
    bsb: {
      validators: {
        // notEmpty: {
        //   message: 'You must enter a BSB',
        //   trim: true
        // },
        // numeric: {
        //   message: 'BSB must be numeric'
        // },
        // stringLength: {
        //   min: 6,
        //   max: 9,
        //   trim: true,
        //   message: 'BSB should be between 6 and 9 characters'
        // },
        customAsync: async () => {
          return new Promise(res => {
            setTimeout(() => {
              res(true);
            }, 1000);
          })
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
    ['radio-example']: {
      validators: {
        choice: {
          min: 1,
          message: 'Select one'
        },
        callback: fieldValidationCallback
      }
    },
    ['checkbox-example']: {
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
  validateOnBlur: true,
  validateOnInput: false,
  validateOnSubmit: true,
  onSubmit: (event, isValid) => {
    // Block form submit if invalid
    if (!isValid) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
});

// const validator = new Validator(document.querySelector('.form'), {
//   declarative: true,
//   submitButton: document.querySelector('button'),
//   onSubmit: (event, isValid) => {
//     // Block form submit if invalid
//     if (!isValid) {
//       event.preventDefault();
//       event.stopImmediatePropagation();
//     }
//   }
// });

document.querySelector('button').addEventListener('click', () => {
  console.log('clicked');
});
