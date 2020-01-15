declare global {
  interface Window {
    [key: string]: Function;
  }
}

interface ConfigI {
  submitButton?: Element | null | undefined;
  validateOnBlur?: boolean;
  validateOnInput?: boolean;
  validateOnSubmit?: boolean;
  onSubmit?: (event: Event, isValid: boolean) => void;
  fields?: {
    [key: string]: {
      validators: {
        [key: string]: {};
      };
    };
  };
  declarative?: boolean;
}

interface ValidatedInputElement extends HTMLInputElement {
  validators: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

// -- UTILITY FUNCTIONS -- //

/**
 * Throw error if condition is met
 * @param {boolean} condition
 * @param {string} message
 */
const throwOnCondition = (condition: boolean, message: string): void => {
  if (condition) {
    throw new Error(`Validator: ${message}`);
  }
};

/**
 * Converts a hyphenated string to camel case
 * Used to capture declarative element attributes
 */
const toCamelCase = (attr: string): string => {
  return attr.replace(/(data-)*vr-/, '').replace(/-[a-z]/g, match => {
    return match.toUpperCase().replace('-', '');
  });
};

/**
 * Converts an HTML attribute into the correct type
 * E.g. 'true' -> true
 * @param {string} value
 */
const convertType = (value: string): string | number | boolean => {
  if (!isNaN(Number(value))) {
    return Number(value);
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

// -- VALIDATOR FUNCTIONS -- //

/**
 * All available validator functions
 */
const validatorFunctions: { [key: string]: Function } = {
  /**
   * Return true if it has length
   * If trim option is present, ignore whitespace
   */
  notEmpty: (value: string, options: { trim?: boolean }): boolean => {
    if (options.trim) {
      value = value.trim();
    }

    return Boolean(value);
  },

  /**
   * Return true if matches regexp
   */
  regexp: (value: string, options: { regexp: RegExp }): boolean => {
    return options.regexp.test(value);
  },

  /**
   * Return true if matches stringLength
   * If min option is present, check min length
   * If max option is present, check max length
   * If trim option is present, ignore whitespace
   */
  stringLength: (
    value: string,
    options: { min?: number; max?: number; trim?: boolean }
  ): boolean => {
    const { min, max, trim } = options;
    let isValid = false;

    if (trim) {
      value = value.trim();
    }

    if (min !== undefined) {
      isValid = value.length >= min;
    }

    if (max !== undefined) {
      isValid = isValid && value.length <= max;
    }

    return isValid;
  },

  /**
   * Return true if numeric
   */
  numeric: (value: string): boolean => {
    return /^\d+$/.test(value);
  },

  /**
   * Run a custom validator
   */
  custom: (
    value: string,
    options: { validatorFunction: (value: string) => boolean }
  ): boolean => {
    return options.validatorFunction(value);
  },

  /**
   * Return true if correct number of radios/checkboxes selected
   * If min option is present, check min elements selected
   * If max option is present, check max elements selected
   */
  choice: (
    combinationFields: NodeListOf<HTMLInputElement>,
    options: { min?: number; max?: number }
  ): boolean => {
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

// -- VALIDATOR CLASS -- //

export default class Validator {
  rootElement: HTMLElement;
  config: ConfigI;
  validateOnBlur: boolean;
  validateOnInput: boolean;
  validateOnSubmit: boolean;
  submitButton: Element | null | undefined;
  fields: Array<ValidatedInputElement>;
  isValid: boolean;

  constructor(rootElement: HTMLElement, config: ConfigI) {
    this.rootElement = rootElement;
    this.config = config;
    this.validateOnBlur = true;
    this.validateOnInput = true;
    this.validateOnSubmit = true;
    this.submitButton = config.submitButton;
    this.fields = [];
    this.isValid = true;

    if (Object.prototype.hasOwnProperty.call(this.config, 'validateOnBlur')) {
      this.validateOnBlur = Boolean(config.validateOnBlur);
    }

    if (Object.prototype.hasOwnProperty.call(this.config, 'validateOnInput')) {
      this.validateOnInput = Boolean(config.validateOnInput);
    }

    if (Object.prototype.hasOwnProperty.call(this.config, 'validateOnSubmit')) {
      this.validateOnSubmit = Boolean(config.validateOnSubmit);
    }

    throwOnCondition(
      !rootElement || !(rootElement instanceof Element),
      'Root element is not an Element.'
    );

    throwOnCondition(
      Boolean(
        this.config.submitButton &&
          !(this.config.submitButton instanceof Element)
      ),
      'Submit button is not an Element.'
    );

    this.addValidatorsToElements();
  }

  /**
   * Add validator configs directly to field DOM elements
   */
  addValidatorsToElements(): void {
    let fieldsConfig = this.config.fields;

    /**
     * Declarative mode (attributes added to elements)
     */
    if (this.config.declarative) {
      fieldsConfig = this.getDeclarativeAttrs();
      throwOnCondition(
        !fieldsConfig,
        'No fields found in root element. Did you add any validator attributes?'
      );
    }

    throwOnCondition(!fieldsConfig, 'No fields provided in config.');

    /**
     * Default mode (fields provided in config)
     */

    const fieldNames = Object.keys(fieldsConfig || {});

    fieldNames.forEach(fieldName => {
      const field = this.rootElement.querySelector(
        `input[name='${fieldName}'],
				select[name='${fieldName}']`
      ) as ValidatedInputElement;

      if (field && fieldsConfig && fieldsConfig[fieldName]) {
        // Add validators to input elements
        const { validators } = fieldsConfig[fieldName];
        field.validators = validators;

        // Add the fields to an array, so we can access them later
        this.fields.push(field);
      }
    });

    // Set up event listeners
    this.attachListeners();
  }

  getDeclarativeAttrs(): ConfigI['fields'] {
    const inputs = this.rootElement.querySelectorAll('input') as NodeListOf<
      ValidatedInputElement
    >;
    const fields: ConfigI['fields'] = {};

    inputs.forEach((input: ValidatedInputElement) => {
      // Grab the all of the validator attributes from the input elements
      const validatorAttributes = [...input.attributes].filter((attr: Attr) =>
        attr.localName.includes('vr-')
      );

      // Skip validation if no attrs present
      if (!validatorAttributes) {
        return;
      }

      // Store validators set to false, so these can be removed
      const ignoredValidators: string[] = [];

      validatorAttributes.forEach((attr: Attr) => {
        if (!attr.nodeValue) {
          return;
        }

        const key = toCamelCase(attr.localName);

        fields[input.name] = fields[input.name] || {
          validators: {}
        };

        const attrRegex = /(.+)__(.+)/;
        const matchArray = key.match(attrRegex);

        if (key.includes('__')) {
          // Handle modifiers

          if (!(matchArray && matchArray.length === 3)) {
            return;
          }

          const [, root, modifier] = matchArray;

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
              : { [modifier]: convertType(attr.nodeValue) };
        } else {
          // Handle validators

          /**
           * If validator is set to 'false', add it to list
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

            const globalCallback = window[String(attr.nodeValue)];

            if (globalCallback && typeof globalCallback === 'function') {
              fields[input.name].validators[key] = globalCallback;
            } else {
              throw new Error(
                `Validator: callback ${attr.nodeValue} is not a function.`
              );
            }
          } else {
            /**
             * If the validator for that field doesn't already exist,
             * set it to the value of the attribute. Otherwise, keep the
             * current validator object as is.
             */
            fields[input.name].validators[key] =
              fields[input.name].validators[key] || convertType(attr.nodeValue);
          }
        }
      });

      /**
       * Remove all disabled validators
       */
      ignoredValidators.forEach(validatorName => {
        delete fields[input.name].validators[validatorName];
      });
    });

    return fields;
  }

  getFields(): ValidatedInputElement[] {
    return this.fields;
  }

  /**
   * Validate a single element
   * @param {Element} field
   */
  validateField(field: ValidatedInputElement): boolean {
    /**
     * If the type is a radio/checkbox,
     * attributes are added to the first element,
     * so we need to run the validators on the first element with that name.
     */
    if (/(radio|checkbox)/.test(field.type)) {
      const firstElement: ValidatedInputElement | null = this.rootElement.querySelector(
        `input[name='${field.name}']`
      );

      if (firstElement) {
        field = firstElement;
      }
    }

    // Get the validators attached to the element
    const fieldValidators = field.validators;

    // Skip validation if no validators present
    if (!fieldValidators) {
      return true;
    }

    const validatorKeys = Object.keys(fieldValidators);
    const errorMessages: string[] = [];
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
      if (key === 'choice' && field.validators.choice) {
        // Get all input elemnts with the name of the selected element
        const combinationFields: NodeListOf<HTMLInputElement> = this.rootElement.querySelectorAll(
          `input[name='${field.name}']`
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

  attachListeners(): void {
    // Form event listener
    const handleFormEvent = (event: Event): void => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement
      ) {
        this.validateField(event.target as ValidatedInputElement);
      }
    };

    /**
     * Attach listeners with event delegation
     */
    if (this.validateOnInput) {
      this.rootElement.addEventListener('input', handleFormEvent);
    }

    if (this.validateOnBlur) {
      // Use event capturing as blur event doesn't bubble
      this.rootElement.addEventListener('blur', handleFormEvent, true);
    }

    this.rootElement.addEventListener('change', handleFormEvent);

    /**
     * Validate all fields on submit button press, if configured
     */
    if (this.config.submitButton && this.validateOnSubmit) {
      this.config.submitButton.addEventListener('click', (event: Event) => {
        this.validateAll();
        /**
         * Run the on submit callback, passing the click event
         * and form validity as parameters.
         *
         * This way, we can do things like prevent form submits
         * when the form is invalid.
         */
        if (typeof this.config.onSubmit === 'function') {
          this.config.onSubmit(event, this.isValid);
        }
      });
    }
  }

  /**
   * Loop through each field and run the validator functions.
   * Set the total validity of the form based on the result.
   */
  validateAll(): boolean {
    const fields = this.getFields();
    this.isValid = true;

    fields.forEach(field => {
      const isFieldValid = this.validateField(field);
      this.isValid = this.isValid && isFieldValid;
    });

    return this.isValid;
  }
}
