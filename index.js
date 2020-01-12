import Validator from "./validator";

const fieldValidationCallback = (field, errors, isValid) => {
  const containerEl = field.closest(".form-field");
  const messageContainer = containerEl.querySelector(".message");
  containerEl.classList.remove("has-error");

  messageContainer.innerHTML = "";

  if (!isValid) {
    containerEl.classList.add("has-error");
  }

  errors.forEach(message => {
    const errorText = document.createElement("span");
    errorText.className = "error-text";
    errorText.innerText = message;

    messageContainer.appendChild(errorText);
  });
};

window.fieldValidationCallback = fieldValidationCallback;

// const validator = new Validator(document.querySelector(".form"), {
//   fields: {
//     bsb: {
//       validators: {
//         notEmpty: {
//           message: "You must enter a BSB",
//           trim: true
//         },
//         numeric: {
//           message: "BSB must be numeric"
//         },
//         stringLength: {
//           min: 6,
//           max: 9,
//           trim: true,
//           message: "BSB should be between 6 and 9 characters"
//         },
//         callback: fieldValidationCallback
//       }
//     },
//     password: {
//       validators: {
//         notEmpty: {
//           message: "You must enter a password",
//           trim: false
//         },
//         regexp: {
//           regexp: /^password$/,
//           message: 'Password should be "password"'
//         },
//         custom: {
//           message: "Must be more than 2 characters",
//           validatorFunction: value => value.length > 2
//         },
//         callback: fieldValidationCallback
//       }
//     }
//   },
//   submitButton: document.querySelector("button"),
//   validateOnBlur: true,
//   validateOnInput: true,
//   validateOnSubmit: true,
//   onSubmit: (event, isValid) => {
//     // Block form submit if invalid
//     if (!isValid) {
//       event.preventDefault();
//       event.stopImmediatePropagation();
//     }
//   }
// });

const validator = new Validator(document.querySelector(".form"), {
  declarative: true,
  submitButton: document.querySelector("button"),
  validateOnBlur: true,
  validateOnInput: true,
  validateOnSubmit: true,
  onSubmit: (event, isValid) => {
    // Block form submit if invalid
    if (!isValid) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
});

document.querySelector("button").addEventListener("click", () => {
  console.log("clicked");
});
