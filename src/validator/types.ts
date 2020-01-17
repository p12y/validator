import { validatorFunctions } from './validators';

declare global {
  interface Window {
    [key: string]: Function | Callback;
  }
}

export type ValidatorFunctionTypes =
  | 'notEmpty'
  | 'regexp'
  | 'stringLength'
  | 'numeric'
  | 'custom'
  | 'choice'
  | 'callback';

export type ValidatorFunctions = {
  [key in ValidatorFunctionTypes]?: Function;
};

export type Callback = (
  field: HTMLInputElement,
  errors: string[],
  isValid: boolean
) => void;

type ValidatorFunction = (value: string, options: {}) => boolean;

interface Test {
  trim?: boolean;
  regexp?: RegExp;
  min?: number;
  max?: number;
  message: string;
  validatorFunction: ValidatorFunction;
  callback?: Callback;
}

export interface ValidatorsConfigI {
  notEmpty?: {
    trim?: boolean;
    message: string;
  };

  regexp?: {
    regexp: RegExp;
    message: string;
  };

  stringLength?: {
    min?: number;
    max?: number;
    trim?: boolean;
    message: string;
  };

  numeric?: {
    message: string;
  };

  custom?: {
    validatorFunction: ValidatorFunction | string;
    message: string;
  };

  choice?: {
    min?: number;
    max?: number;
    message: string;
  };

  callback?: Callback;
}

export type FieldValidators = {
  [key: string]: {
    validators: {
      [key in keyof ValidatorsConfigI]?: ValidatorsConfigI[key];
    };
  };
};

export interface ConfigI {
  submitButton?: Element | null | undefined;
  validateOnBlur?: boolean;
  validateOnInput?: boolean;
  validateOnSubmit?: boolean;
  onSubmit?: (event: Event, isValid: boolean) => void;
  fields?: {
    [key: string]: {
      validators: {
        [key in keyof ValidatorsConfigI]: ValidatorsConfigI[key];
      };
    };
  };
  declarative?: boolean;
}

export interface ValidatedInputElement extends HTMLInputElement {
  validators: {
    [key in keyof ValidatorsConfigI]: ValidatorsConfigI[key];
  };
}

export type ValidFunctionName = keyof typeof validatorFunctions;
