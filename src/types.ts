export enum FormState {
  Valid = "valid",
  Invalid = "invalid",
  Pending = "pending",
}

export enum FormEvents {
  Input = "input",
  Blur = "blur",
  Change = "change",
  Submit = "submit",
}

export enum ValidatorName {
  NotEmpty = "notEmpty",
  Numeric = "numeric",
  Custom = "custom",
  StringLength = "stringLength",
  Choice = "choice",
  Regexp = "regexp",
}

export enum ValidatorEvent {
  Complete = "validator.complete",
}

export interface ValidatorConfigI {
  message: string;
  input?: boolean;
  blur?: boolean;
  change?: boolean;
  submit?: boolean;
}

export interface ConfigI {
  onStateChange?: (state: FormState) => void;
  submitButton?: Element | null | undefined;
  fields?: {
    [fieldName: string]: {
      validators: ValidatorsConfigI;
      begin?: (field: HTMLInputElement) => void;
      complete?: (
        field: HTMLInputElement,
        state: FormState,
        errors: string[]
      ) => void;
    };
  };
}

export interface ValidatorFunctionI {
  (value: string): Promise<boolean> | boolean;
  errorMessage: string;
  fieldName: string;
  field: HTMLInputElement;
  validatorName: string;
}

interface NotEmptyValidatorConfigI extends ValidatorConfigI {
  trim?: boolean;
}

interface StringLengthValidatorConfigI extends ValidatorConfigI {
  min?: number;
  max?: number;
  trim?: boolean;
}

interface CustomValidatorConfigI extends ValidatorConfigI {
  validatorFunction: (value: string) => Promise<boolean> | boolean;
}

interface ChoiceValidatorConfigI extends ValidatorConfigI {
  min?: number;
  max?: number;
}

interface RegexpValidatorConfigI extends ValidatorConfigI {
  regexp: RegExp;
}

interface ValidatorsConfigI {
  [ValidatorName.NotEmpty]?: NotEmptyValidatorConfigI;
  [ValidatorName.Numeric]?: ValidatorConfigI;
  [ValidatorName.Custom]?: CustomValidatorConfigI;
  [ValidatorName.StringLength]?: StringLengthValidatorConfigI;
  [ValidatorName.Choice]?: ChoiceValidatorConfigI;
  [ValidatorName.Regexp]?: RegexpValidatorConfigI;
}
