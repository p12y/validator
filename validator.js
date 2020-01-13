/**
 * All available validator functions
 */
const validatorFunctions = {
  /**
   * Return true if it has length
   * If trim option is present, ignore whitespace
   */
  notEmpty: (value, options) => {
    if (options.trim) {
      value = value.trim();
    }

    return Boolean(value);
  },

  /**
   * Return true if matches regexp
   */
  regexp: (value, options) => {
    return options.regexp.test(value);
  },

  /**
   * Return true if matches stringLength
   * If min option is present, check min length
   * If max option is present, check max length
   * If trim option is present, ignore whitespace
   */
  stringLength: (value, options) => {
    const { min, max, trim } = options;
    let isValid = false;

    if (trim) {
      value = value.trim();
    }

    if (options.min) {
      isValid = value.length >= min;
    }

    if (options.max) {
      isValid = isValid && value.length <= max;
    }

    return isValid;
  },

  /**
   * Return true if numeric
   */
  numeric: value => {
    return /\d+/.test(value);
  },

  /**
   * Run a custom validator
   */
  custom: (value, options) => {
    return options.validatorFunction(value);
  },

  /**
   * Return true if correct number of radios/checkboxes selected
   * If min option is present, check min elements selected
   * If max option is present, check max elements selected
   */
  choice: (combinationFields, options) => {
    const fieldsArr = [...combinationFields];

    let isValid = true;

    if (options.min) {
      isValid = fieldsArr.filter(field => field.checked).length >= options.min;
    }

    if (options.max) {
      isValid =
        isValid &&
        fieldsArr.filter(field => field.checked).length <= options.max;
    }

    return isValid;
  }
};

/**
 * Throw error if condition is met
 * @param {boolean} condition
 * @param {string} message
 */
const throwOnCondition = (condition, message) => {
  if (condition) {
    throw new Error(`Validator: ${message}`);
  }
};

/**
 * Converts a hyphenated string to camel case
 * Used to capture declarative element attributes
 */
const toCamelCase = string => {
  return string.replace(/(data-)*vr-/, '').replace(/-[a-z]/g, match => {
    return match.toUpperCase().replace('-', '');
  });
};

/**
 * Converts an HTML attribute into the correct type
 * E.g. "true" -> true
 * @param {string} value
 */
const convertType = value => {
  if (!isNaN(Number(value))) {
    return Number(value);
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export default class Validator {
  constructor(rootElement, config) {
    this.rootElement = rootElement;
    this.config = config;
    this.validateOnBlur = true;
    this.validateOnInput = false;
    this.validateOnSubmit = true;
    this.submitButton = config.submitButton;
    this.fields = [];
    this.isValid = true;

    if (this.config.hasOwnProperty('validateOnBlur')) {
      this.validateOnBlur = Boolean(config.validateOnBlur);
    }

    if (this.config.hasOwnProperty('validateOnInput')) {
      this.validateOnInput = Boolean(config.validateOnInput);
    }

    if (this.config.hasOwnProperty('validateOnSubmit')) {
      this.validateOnSubmit = Boolean(config.validateOnSubmit);
    }

    throwOnCondition(
      !rootElement || !(rootElement instanceof Element),
      'Root element is not an Element.'
    );

    throwOnCondition(
      this.config.submitButton &&
        !(this.config.submitButton instanceof Element),
      'Submit button is not an Element.'
    );

    this.addValidatorsToElements();
  }

  /**
   * Add validator configs directly to field DOM elements
   */
  addValidatorsToElements() {
    let fieldsConfig = this.config.fields;

    /**
     * Declarative mode (attributes added to elements)
     */
    if (this.config.declarative) {
      const inputs = this.rootElement.querySelectorAll('input');
      const fields = {};

      inputs.forEach(input => {
        // Grab the all of the validator attributes from the input elements
        const validatorAttributes = [...input.attributes].filter(attr =>
          attr.localName.includes('vr-')
        );

        // Skip validation if no attrs present
        if (!validatorAttributes) {
          return;
        }

        // Store validators set to false, so these can be removed
        const ignoredValidators = [];

        validatorAttributes.forEach(attr => {
          const key = toCamelCase(attr.localName);
          fields[input.name] = fields[input.name] || {
            validators: {}
          };

          // Handle modifiers
          if (key.includes('__')) {
            const [, root, modifier] = key.match('(.+)__(.+)');

            /**
             * Add modifier values to the correct validators
             * for each field
             */
            fields[input.name].validators[root] =
              typeof fields[input.name].validators[root] === 'object'
                ? {
                    ...fields[input.name].validators[root],
                    [modifier]: convertType(attr.nodeValue)
                  }
                : {
                    [modifier]: convertType(attr.nodeValue)
                  };
          } else {
            // Handle validators

            /**
             * If validator is set to "false", add it to list
             * so it can be deleted later
             */
            if (!convertType(attr.nodeValue)) {
              ignoredValidators.push(key);
            }

            if (key === 'callback') {
              /**
               * Get the callback function from the window object
               * and assign it to the validator object
               */
              throwOnCondition(
                !window[attr.nodeValue],
                `${input.name} field: callback is not a function`
              );

              fields[input.name].validators[key] = window[attr.nodeValue];
            } else {
              // Set the validator object
              fields[input.name].validators[key] =
                fields[input.name].validators[key] ||
                convertType(attr.nodeValue);
            }
          }
        });

        /**
         * Remove all disabled validators
         */
        ignoredValidators.forEach(validatorName => {
          if (validatorName in fields[input.name].validators) {
            delete fields[input.name].validators[validatorName];
          }
        });
      });
      fieldsConfig = fields;
    }

    /**
     * Default mode (fields provided in config)
     */

    let fieldNames = Object.keys(fieldsConfig || {});

    /**
     * By now, we should have all the validation field names,
     * if there are none, throw an error.
     */
    throwOnCondition(!fieldNames.length, 'No fields provided in config.');

    fieldNames.forEach(fieldName => {
      const field = this.rootElement.querySelector(
        `input[name="${fieldName}"]`
      );

      if (!field) {
        return;
      }

      // Add validators to input elements
      const { validators } = fieldsConfig[fieldName];
      field.validators = validators;

      // Add the fields to an array, so we can access them later
      this.fields.push(field);
    });

    // Set up event listeners
    this.attachListeners();
  }

  getFields() {
    return this.fields;
  }

  /**
   * Validate a single element
   * @param {Element} field
   */
  validateField(field) {
    /**
     * If the type is a radio/checkbox,
     * attributes are added to the first element,
     * so we need to run the validators on the first element with that name.
     */
    if (field.type === 'radio' || field.type === 'checkbox') {
      field = this.rootElement.querySelector(`input[name="${field.name}"]`);
    }

    // Get the validators attached to the element
    const fieldValidators = field.validators;

    if (!fieldValidators) {
      return;
    }

    const validatorKeys = Object.keys(fieldValidators);
    const errorMessages = [];
    let isFieldValid = true;

    validatorKeys.forEach(key => {
      // Exit this iteration if the key is not a valid validator functinon
      if (key === 'callback' || typeof validatorFunctions[key] !== 'function') {
        return;
      }

      let isValidatorPassing = true;

      /**
       * The choice validator is quite different to the others,
       * we need to pass in a list of input elements, so we can calculate how
       * many have been selected.
       */
      if (key === 'choice') {
        // Get all input elemnts with the name of the selected element
        const combinationFields = this.rootElement.querySelectorAll(
          `input[name="${field.name}"]`
        );

        // Determine if the field passes the choice validator
        isValidatorPassing = validatorFunctions[key](
          combinationFields,
          field.validators.choice
        );
      } else {
        // Determine if the field passes a single, generic validator
        isValidatorPassing = validatorFunctions[key](
          field.value,
          field.validators[key]
        );
      }

      /**
       * If the field fails a single validation,
       * set the field to invalid and add error message to array
       */
      if (!isValidatorPassing) {
        isFieldValid = false;

        const message = field.validators[key].message;

        if (message) {
          errorMessages.push(message);
        }
      }
    });

    // Run the field validator callback, if it exists
    if (
      field.validators.callback &&
      typeof field.validators.callback === 'function'
    ) {
      field.validators.callback(field, errorMessages, isFieldValid);
    }
    return isFieldValid;
  }

  attachListeners() {
    // Form event listener
    const handleFormEvent = event => {
      if (event.target instanceof HTMLInputElement) {
        this.validateField(event.target);
      }
    };

    /**
     * Attach listeners with event delegation
     */
    if (this.config.validateOnInput) {
      this.rootElement.addEventListener('input', handleFormEvent);
    }

    if (this.config.validateOnBlur) {
      // Use event capturing as blur event doesn't bubble
      this.rootElement.addEventListener('blur', handleFormEvent, true);
    }

    this.rootElement.addEventListener('change', handleFormEvent);

    /**
     * Validate all fields on submit button press, if configured
     */
    if (this.config.submitButton && this.validateOnSubmit) {
      this.config.submitButton.addEventListener('click', event => {
        this.validateAll();
        /**
         * Run the on submit callback, passing the click event
         * and form validity as parameters.
         *
         * This way, we can do things like prevent form submits
         * when the form is invalid.
         */
        this.config.onSubmit(event, this.isValid);
      });
    }
  }

  /**
   * Loop through each field and run the validator functions.
   * Set the total validity of the form based on the result.
   */
  validateAll() {
    const fields = this.getFields();
    this.isValid = true;

    fields.forEach(field => {
      const isFieldValid = this.validateField(field);
      this.isValid = this.isValid && isFieldValid;
    });

    return this.isValid;
  }
}
