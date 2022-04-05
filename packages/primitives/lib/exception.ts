import { Nullable, Optional } from '@guarani/types';

/**
 * Exception class that keeps the Stack Trace of rethrown Errors.
 */
export class Exception extends Error {
  /**
   * Previous Error of the Chain.
   */
  public readonly originalError?: Optional<Error>;

  /**
   * Instantiates an empty Exception.
   */
  public constructor();

  /**
   * Instantiates a new Exception based on the provide message.
   *
   * @param message Message of the Exception.
   */
  public constructor(message: string);

  /**
   * Instantiates a new Exception by rethrowing the provided Error.
   *
   * @param originalError Rethrown Error.
   */
  public constructor(originalError: Error);

  /**
   * Instantiates a new Exception with the provided message and chaining the provided Error's Stack Trace.
   *
   * @param message Message of the Exception.
   * @param originalError Rethrown Error.
   */
  public constructor(message: Nullable<string>, originalError: Error);

  /**
   * Instantiates a new Exception based on the provided parameters.
   *
   * @param messageOrBaseError Message of the Exception or rethrown Error.
   * @param originalError Rethrown Error.
   */
  public constructor(messageOrBaseError?: Optional<Nullable<string> | Error>, originalError?: Optional<Error>) {
    originalError = messageOrBaseError instanceof Error ? messageOrBaseError : originalError;

    super(
      messageOrBaseError === null
        ? undefined
        : typeof messageOrBaseError === 'string'
        ? <any>messageOrBaseError
        : originalError?.message
    );

    this.name = this.constructor.name;

    Object.defineProperty(this, 'originalError', { enumerable: false, value: originalError, writable: true });

    if (this.message === '') {
      this.message = this.getDefaultMessage();
    }

    // TODO: Check if this does not cause a memory leak.
    const thisStack = this.stack ?? '';
    const originalStack = (this.originalError?.stack ?? '').split('\n').slice(0, Error.stackTraceLimit).join('\n');

    this.stack =
      this.originalError === undefined ? `${thisStack}\n${originalStack}` : `${thisStack}\nFrom ${originalStack}`;
  }

  /**
   * Returns the default Exception Message.
   */
  protected getDefaultMessage(): string {
    return '';
  }
}
