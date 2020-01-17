import { ValidatorFunctions } from './types';

export const validatorFunctions: ValidatorFunctions = {
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
