/**
 * VALIDATOR USAGE EXAMPLE
 */

import Validator, { FormState } from "./src/validator";

declare global {
  interface Window {
    fieldValidationCallback: (
      field: HTMLInputElement,
      errors: string[],
      isValid: boolean
    ) => void;
  }
}

/**
 * Example callback to update the DOM
 */
const fieldValidationCallback = (
  field: HTMLInputElement,
  state: FormState,
  errors: string[]
) => {
  const containerEl = field.closest(".form-field");
  const messageContainer = containerEl.querySelector(".message");
  containerEl.classList.remove("has-error");

  messageContainer.innerHTML = "";

  if (state === FormState.Invalid) {
    containerEl.classList.add("has-error");
  }

  errors.forEach((message) => {
    const errorText = document.createElement("span");
    errorText.className = "error-text";
    errorText.innerText = message;

    messageContainer.appendChild(errorText);
  });
};

/**
 * Example usage of the Validator class
 */
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

document.querySelector("button").addEventListener("click", (e) => {
  if (!validator.valid) {
    e.preventDefault();
  } else {
    alert("Submitted!");
  }
});
