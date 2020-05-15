export default class CustomEventCompat {
  private event: CustomEvent;

  /**
   * Creates a custom event that is compatible with older browsers
   */
  constructor(typeArg: string, customEventInit?: CustomEventInit) {
    let event;

    try {
      event = new window.CustomEvent(typeArg, customEventInit);
    } catch (error) {
      event = document.createEvent("CustomEvent");
      event.initCustomEvent(typeArg, true, true, customEventInit);
    }

    this.event = event;
  }

  /**
   *
   * @param eventTarget Dispatches the event from the event target. If no target is specified, the default is document.
   */
  public dispatch(eventTarget?: EventTarget): void {
    (eventTarget || document).dispatchEvent(this.event);
  }
}
