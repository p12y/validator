import { ValidatorName } from "./types";

const validatorFunctions: { [validatorName: string]: Function } = {
  /**
   * Return true if value has length
   * If trim option is present, ignore whitespace
   */
  [ValidatorName.NotEmpty]: (
    options: { trim?: boolean },
    value: string
  ): boolean => {
    if (options.trim) {
      value = value.trim();
    }

    return Boolean(value);
  },

  /**
   * Return true if value matches regexp
   */
  [ValidatorName.Regexp]: (
    options: { regexp: RegExp },
    value: string
  ): boolean => {
    return options.regexp.test(value);
  },

  /**
   * Return true if  value matches stringLength
   * If min option is present, check min length
   * If max option is present, check max length
   * If trim option is present, ignore whitespace
   */
  [ValidatorName.StringLength]: (
    options: { min?: number; max?: number; trim?: boolean },
    value: string
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
  [ValidatorName.Numeric]: (_options: {}, value: string): boolean => {
    return /^\d+$/.test(value);
  },

  /**
   * Run a custom validator (supports async)
   */
  [ValidatorName.Custom]: async (
    options: {
      validatorFunction: (value: string) => Promise<boolean> | boolean;
    },
    value: string
  ): Promise<boolean> => {
    const result = await options.validatorFunction(value);
    return result;
  },

  /**
   * Return true if correct number of radios/checkboxes selected
   * If min option is present, check min elements selected
   * If max option is present, check max elements selected
   */
  [ValidatorName.Choice]: (
    options: { min?: number; max?: number },
    _value: string,
    fields: HTMLInputElement[]
  ): boolean => {
    let isValid = true;
    const numChecked = fields.filter((field) => field.checked).length;

    if (options.min) {
      isValid = numChecked >= options.min;
    }

    if (options.max) {
      isValid = isValid && numChecked <= options.max;
    }

    return isValid;
  },
};

export default validatorFunctions;
