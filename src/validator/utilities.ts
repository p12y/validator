import { validatorFunctions } from './validators';
import { ValidFunctionName } from './types';

/**
 * Throw error if condition is met
 * @param {boolean} condition
 * @param {string} message
 */
export const throwOnCondition = (condition: boolean, message: string): void => {
  if (condition) {
    throw new Error(`Validator: ${message}`);
  }
};

/**
 * Converts a hyphenated string to camel case
 * Used to capture declarative element attributes
 */
export const toCamelCase = (attr: string): string => {
  return attr.replace(/(data-)*vr-/, '').replace(/-[a-z]/g, match => {
    return match.toUpperCase().replace('-', '');
  });
};

/**
 * Converts an HTML attribute into the correct type
 * E.g. 'true' -> true
 * @param {string} value
 */
export const convertType = (value: string): string | number | boolean => {
  if (!isNaN(Number(value))) {
    return Number(value);
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const isValidFunctionName = (
  name: string
): name is ValidFunctionName => {
  return Object.prototype.hasOwnProperty.call(validatorFunctions, name);
};
