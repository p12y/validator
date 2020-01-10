const validatorFunctions = {
  notEmpty: value => {
    return Boolean(value);
  },

  regexp: (value, validator) => {
    return validator.regexp.test(value);
  },

  stringLength: (value, validator) => {
    const { min, max, trim } = validator;
    let isValid = false;

    if (trim) {
      value = value.trim();
    }

    if (validator.min) {
      isValid = value.length >= min;
    }

    if (validator.max) {
      isValid = isValid && value.length <= max;
    }

    return isValid;
  }
};

export default class Validator {
  constructor(config) {
    this.config = config;
    this.validateOnBlur = Boolean(config.validateOnBlur) || true;
    this.validateOnInput = Boolean(config.validateOnInput) || false;
    this.submitButton = config.submitButton;
    this.addListeners();
  }

  addListeners() {
    this.config.fields.forEach(fieldConfig => {
      const { element } = fieldConfig;
      const { validators } = fieldConfig;
      const keys = Object.keys(validators);
      const fieldValidations = [];
      const self = this;

      keys.forEach(key => {
        fieldValidations.push({
          ...validators[key],
          validatorFn: validatorFunctions[key]
        });
      });

      /**
       * Run all validator functions
       */
      const runValidations = function() {
        const { value } = this;
        const errors = [];
        // Set the validator to valid by default
        self.isValid = true;

        fieldValidations.forEach(validator => {
          const { validatorFn, message } = validator;
          const isValid = Boolean(validatorFn(value, validator));

          if (!isValid) {
            /**
             * If a field fails validation
             * Set the status to invalid & push the error message
             */
            self.isValid = false;
            if (message) {
              errors.push(message);
            }
          }
        });

        console.log(errors);
      };

      if (this.validateOnBlur) {
        element.addEventListener("blur", function() {
          runValidations.call(this);
        });
      }

      if (this.validateOnInput) {
        element.addEventListener("input", function() {
          runValidations.call(this);
        });
      }

      if (this.submitButton && this.submitButton instanceof Element) {
        this.submitButton.addEventListener("click", () => {
          runValidations.call(this);
        });
      }
    });
  }
}
