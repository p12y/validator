import Validator from "./validator";

const validator = new Validator({
  fields: [
    {
      element: document.getElementById("bsbInput"),
      validators: {
        notEmpty: {
          message: "You must enter a BSB"
        },
        stringLength: {
          min: 6,
          max: 9,
          trim: true,
          message: "BSB should be between 6 and 9 characters"
        }
      }
    },
    {
      element: document.getElementById("password"),
      validators: {
        notEmpty: {
          message: "You must enter a password"
        },
        regexp: {
          regexp: /password/,
          message: 'Password should be "password"'
        }
      }
    }
  ],
  submitButton: document.querySelector("button"),
  validateOnBlur: true,
  validateOnInput: true
});
