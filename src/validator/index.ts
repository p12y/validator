import {
  ConfigI,
  ValidatedInputElement,
  Callback,
  FieldValidators,
  ValidatorFunctionTypes
} from './types';
import {
  throwOnCondition,
  toCamelCase,
  convertType,
  isValidFunctionName
} from './utilities';
import { validatorFunctions } from './validators';

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

  getDeclarativeAttrs(): FieldValidators {
    const inputs = this.rootElement.querySelectorAll('input') as NodeListOf<
      ValidatedInputElement
    >;
    const fields: FieldValidators = {};

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

          if (isValidFunctionName(root)) {
            fields[input.name].validators[root] =
              typeof fields[input.name].validators[root] === 'object'
                ? {
                    ...fields[input.name].validators[root],
                    [modifier]: convertType(attr.nodeValue)
                  }
                : { [modifier]: convertType(attr.nodeValue) };
          }
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

            const globalCallback = window[String(attr.nodeValue)] as Callback;

            if (globalCallback && typeof globalCallback === 'function') {
              fields[input.name].validators[key] = globalCallback;
            } else {
              throw new Error(
                `Validator: callback ${attr.nodeValue} is not a function.`
              );
            }
          }
        }
      });

      /**
       * Remove all disabled validators
       */
      ignoredValidators.forEach(validatorName => {
        if (isValidFunctionName(validatorName)) {
          delete fields[input.name].validators[validatorName];
        }
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
      if (!isValidFunctionName(key)) {
        return;
      }

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
      const validatorFunction = validatorFunctions[key];

      if (typeof validatorFunction === 'function') {
        if (key === 'choice' && field.validators.choice) {
          // Get all input elemnts with the name of the selected element
          const combinationFields: NodeListOf<HTMLInputElement> = this.rootElement.querySelectorAll(
            `input[name='${field.name}']`
          );

          // Determine if the field passes the choice validator
          isValidatorPassing = validatorFunction(
            combinationFields,
            field.validators.choice
          );
        } else {
          // Determine if the field passes a single, generic validator
          isValidatorPassing = validatorFunction(
            field.value,
            field.validators[key]
          );
        }
      }

      /**
       * If the field fails a single validation,
       * set the field to invalid and add error message to array
       */
      if (!isValidatorPassing) {
        isFieldValid = false;

        const message = field.validators[key]?.message;

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
