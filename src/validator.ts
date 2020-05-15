import CustomEventCompat from "./custom-event-compat";
import validatorFunctions from "./validator-functions";
import {
  FormState,
  FormEvents,
  ValidatorName,
  ValidatorEvent,
  ValidatorConfigI,
  ConfigI,
  ValidatorFunctionI,
} from "./types";

class Validator {
  /**
   * The validity state of the form/collection
   */
  public state: FormState;
  /**
   * The element containing all the form elements to be validated
   */
  private containerElement: HTMLElement;
  /**
   * The supplied configuration
   */
  private config: ConfigI;
  /**
   * List of validators that were successful
   */
  private successfulValidators: Set<ValidatorFunctionI>;
  /**
   * Total count of all unique validator functions
   */
  private validatorCount: number;
  /**
   * Stores unique validator functions by field name & validator name, to prevent duplicates
   */
  private validatorMemo: {
    [fieldAndValidatorName: string]: ValidatorFunctionI;
  };
  /**
   * Stores validator functions by event type to be called on the event
   */
  private handlers: {
    [eventName in FormEvents]: ValidatorFunctionI[];
  };
  /**
   * Stores callbacks to be called after validation
   */
  private callbacks: {
    [fieldName: string]: {
      begin?: (field: HTMLInputElement) => void;
      complete?: (
        field: HTMLInputElement,
        state: FormState,
        errors: string[]
      ) => void;
    };
  };
  /**
   * Stores unresolved async validators
   */
  private pendingValidators: Set<ValidatorFunctionI>;

  constructor(containerElement: HTMLElement, config: ConfigI) {
    this.containerElement = containerElement;
    this.config = config;
    this.state = FormState.Invalid;
    this.validatorCount = 0;
    this.successfulValidators = new Set();
    this.pendingValidators = new Set();
    this.callbacks = {};
    this.validatorMemo = {};
    this.handlers = {
      [FormEvents.Input]: [],
      [FormEvents.Blur]: [],
      [FormEvents.Change]: [],
      [FormEvents.Submit]: [],
    };

    /**
     * Create validator functions & add event listeners
     */
    this.createValidators();
    this.addListeners();
  }

  /**
   * Add listeners which call validator functions
   */
  private addListeners(): void {
    this.containerElement.addEventListener(
      "focusout",
      this.createEventHandler(FormEvents.Blur)
    );
    this.containerElement.addEventListener(
      "input",
      this.createEventHandler(FormEvents.Input)
    );
    this.containerElement.addEventListener(
      "change",
      this.createEventHandler(FormEvents.Change)
    );

    /**
     * If the submit button is supplied, run validators on click
     */
    if (this.config.submitButton) {
      this.config.submitButton.addEventListener("click", this.handleSubmit);
    }
  }

  /**
   * Sets the validity state of the form and then invokes a callback
   */
  private setState = (state: FormState): void => {
    this.state = state;
    this.config.onStateChange?.(state);
  };

  /**
   * Runs all synchronous validators.
   * Skips async validators, as we don't want them running on submit, but set them to invalid to display an error.
   */
  private handleSubmit = async (): Promise<void> => {
    /**
     * If a request is currently pending, wait for it to finish before resuming
     */
    await new Promise((resolve) => {
      if (this.state === FormState.Pending || this.pendingValidators.size) {
        const handleValidationComplete = ((): void => {
          document.removeEventListener(
            ValidatorEvent.Complete,
            handleValidationComplete
          );
          resolve();
        }) as EventListener;

        document.addEventListener(ValidatorEvent.Complete, (event) => {
          if (!this.pendingValidators.size) {
            handleValidationComplete(event);
          }
        });
      } else {
        resolve();
      }
    });

    /**
     * Store array of error messages for each field
     */
    const errors: Map<HTMLInputElement, string[]> = new Map();
    const updateErrors = (validator: ValidatorFunctionI): void => {
      const errorMessages = (errors.get(validator.field) || []).slice(0);
      errorMessages.push(validator.errorMessage);
      errors.set(validator.field, errorMessages);
    };

    /**
     * Run all submit validators
     */
    await this.executeValidators({
      formEvent: FormEvents.Submit,
      invalidCallback: (validator) => updateErrors(validator),
    });

    /**
     * Trigger callbacks for each field passing in validity and error messages
     */
    this.handlers[FormEvents.Submit].forEach((validator) => {
      const errorMessages = errors.get(validator.field) || [];

      this.callbacks[validator.field.name]?.complete?.(
        validator.field,
        !errorMessages.length ? FormState.Valid : FormState.Invalid,
        errorMessages
      );
    });

    this.setValidity();
  };

  /**
   * Run all validators for a specified event type.
   * You can specify a condition to run each validator as well as pass in a
   * callback to be run on a validator fail.
   */
  private async executeValidators({
    formEvent,
    runCondition = (): boolean => true,
    invalidCallback,
  }: {
    formEvent: FormEvents;
    runCondition?: (validator: ValidatorFunctionI) => boolean;
    invalidCallback?: (validator: ValidatorFunctionI) => void;
  }): Promise<void[]> {
    return Promise.all(
      this.handlers[formEvent].map(async (validator) => {
        if (runCondition(validator)) {
          // Add the validator to the list of pending handlers
          this.pendingValidators.add(validator);

          // Run the validator
          const isValidatorPassing = await validator(validator.field.value);

          // Remove the validator from the list of pending handlers
          this.pendingValidators.delete(validator);

          if (isValidatorPassing) {
            // Add successful validator
            this.successfulValidators.add(validator);
          } else {
            // Remove successful validator
            this.successfulValidators.delete(validator);
            // Add the error message to the errors array
            invalidCallback?.(validator);
          }
        }
      })
    );
  }

  /**
   * If the number of successsful validators is the same as
   * the total number of unique validators, the form must be valid.
   * Set the form's state with this.
   */
  private setValidity(): void {
    // Set the state if there are no pending validators
    if (!this.pendingValidators.size) {
      if (this.successfulValidators.size === this.validatorCount) {
        this.setState(FormState.Valid);
      } else {
        this.setState(FormState.Invalid);
      }
    }
  }

  /**
   * Dynamically creates an event validator which runs the validation
   */
  private createEventHandler = (eventName: FormEvents) => async (
    event: Event
  ): Promise<void> => {
    const target = event.target as HTMLInputElement;
    const fieldName = target.name;

    /**
     * As we're using event delegation, it's possible that there aren't any validators for this event type and field.
     * If that's the case, we will return without validating the field.
     */
    if (
      !this.handlers[eventName].some(
        (validatorFn) => validatorFn.fieldName === fieldName
      )
    ) {
      return;
    }

    /**
     * Set the state to pending as we may be making async calls
     */
    this.setState(FormState.Pending);
    // Run the begin callback for this field
    this.callbacks[fieldName]?.begin?.(target);

    /**
     * Clear successful validators on input.
     * As the value has changed, we want to disregard the previous validity.
     */
    if (eventName === FormEvents.Input) {
      this.successfulValidators.forEach((validatorFn) => {
        if (validatorFn.fieldName === fieldName) {
          this.successfulValidators.delete(validatorFn);
        }
      });
    }

    const errors: string[] = [];

    /**
     * Await all validators for this event name & field to complete
     */
    await this.executeValidators({
      formEvent: eventName,
      runCondition: (validator) => validator.fieldName === fieldName,
      invalidCallback: (validator) => errors.push(validator.errorMessage),
    });

    // Run the complete callback for this field
    this.callbacks[fieldName]?.complete?.(
      target,
      !errors.length ? FormState.Valid : FormState.Invalid,
      errors
    );

    /**
     * Set the validity state of the form
     */
    this.setValidity();

    /**
     * Dispatch an event signifying the end of async operations
     */
    const completeEvent = new CustomEventCompat(ValidatorEvent.Complete);
    completeEvent.dispatch();
  };

  /**
   * Creates validator functions
   */
  private createValidators(): void {
    if (!this.config.fields) {
      return;
    }

    // Loop through the config
    for (const [fieldName, validatorsConfig] of Object.entries(
      this.config.fields
    )) {
      // Store callbacks to be called after validation
      this.callbacks[fieldName] = {
        begin: validatorsConfig.begin,
        complete: validatorsConfig.complete,
      };

      for (const [validatorName, validatorConfig] of Object.entries(
        validatorsConfig.validators
      )) {
        // Submit should be true by default, unless otherwise specified
        validatorConfig.submit =
          validatorConfig.submit === undefined ? true : validatorConfig.submit;

        Object.values(FormEvents).forEach((eventType) => {
          if (validatorConfig[eventType]) {
            try {
              // Create the validator function
              const validator = this.createValidator(
                fieldName,
                validatorName,
                validatorConfig
              );
              // Store validators under each event type
              this.handlers[eventType].push(validator);
            } catch (error) {
              console.warn(error);
            }
          }
        });
      }
    }
  }

  /**
   * Creates a validator function from the config, using the list of available validators
   */
  private createValidator(
    fieldName: string,
    validatorName: string,
    options: ValidatorConfigI
  ): ValidatorFunctionI {
    let fieldsArr: HTMLInputElement[] | undefined;
    const field = this.containerElement.querySelector<HTMLInputElement>(
      `[name="${fieldName}"]`
    );

    if (!field) {
      throw `Field "${fieldName}" not found.`;
    }

    /**
     * As the choice validator takes a list of elements, we need to get all
     * the elements with this name and pass it to the validator function.
     */
    if (validatorName === ValidatorName.Choice) {
      const nodeList: NodeListOf<
        HTMLInputElement
      > | null = this.containerElement.querySelectorAll(
        `[name="${fieldName}"]`
      );

      if (nodeList) {
        fieldsArr = Array.from(nodeList);
      }
    }

    // Create the validator
    const validator = (value: string): boolean => {
      const result = validatorFunctions[validatorName](
        options,
        value,
        fieldsArr
      );
      return result;
    };

    /**
     * Set properties on the function for easy access
     */
    validator.validatorName = validatorName;
    validator.fieldName = fieldName;
    validator.errorMessage = options.message || "";
    validator.field = field;

    /**
     * Avoid storing the same validator more than once.
     * This would happen if you had a validator being run on multiple events.
     */
    if (!this.validatorMemo[`${fieldName}.${validatorName}`]) {
      this.validatorMemo[`${fieldName}.${validatorName}`] = validator;
    } else {
      // Return the existing validator function
      return this.validatorMemo[`${fieldName}.${validatorName}`];
    }

    // As we're creating a new validator, we increment the count
    this.validatorCount += 1;

    // Return the new validator function
    return validator;
  }

  /**
   * States if the form is valid (passing all validators)
   */
  public get valid(): boolean {
    return this.state === FormState.Valid;
  }
}

export default Validator;

export { FormState };
