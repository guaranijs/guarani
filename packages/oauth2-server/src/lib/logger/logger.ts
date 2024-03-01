import { Injectable } from '@guarani/di';

import { LoggerLevel } from './logger-level.enum';

/**
 * Definition of the Logger supported by Guarani.
 */
@Injectable()
export abstract class Logger {
  /**
   * Level of the Logger.
   */
  protected readonly loggerLevel!: LoggerLevel;

  /**
   * Logs a message with its parameters based on the provided logger level.
   *
   * @param loggerLevel Level of the message being logged.
   * @param message Message of the log.
   * @param location Code Location of the log.
   * @param parameters Parameters of the log.
   */
  protected abstract log(loggerLevel: LoggerLevel, message: string, location: string, ...parameters: unknown[]): void;

  /**
   * Indicates an error that prevents the system from functioning correctly.
   *
   * @param message Message of the log.
   * @param location Code Location of the log.
   * @param data Additional data to provide context to the log.
   * @param exc Error instance to provide context to the log.
   * @param parameters Parameters of the log.
   */
  public critical(message: string, location: string, data?: unknown, exc?: Error, ...parameters: unknown[]): void {
    if (this.ensureLoggerLevel(LoggerLevel.CRITICAL)) {
      this.log(LoggerLevel.CRITICAL, message, location, data, exc, ...parameters);
    }
  }

  /**
   * Indicates an error caused by the business rules of the system,
   * but does not prevent the system from functioning correctly.
   *
   * @param message Message of the log.
   * @param location Code Location of the log.
   * @param data Additional data to provide context to the log.
   * @param exc Error instance to provide context to the log.
   * @param parameters Parameters of the log.
   */
  public error(message: string, location: string, data?: unknown, exc?: Error, ...parameters: unknown[]): void {
    if (this.ensureLoggerLevel(LoggerLevel.ERROR)) {
      this.log(LoggerLevel.ERROR, message, location, data, exc, ...parameters);
    }
  }

  /**
   * Indicates that something happened on the system that should be further
   * investigated, but does not affect the functionality of the system.
   *
   * @param message Message of the log.
   * @param location Code Location of the log.
   * @param data Additional data to provide context to the log.
   * @param exc Error instance to provide context to the log.
   * @param parameters Parameters of the log.
   */
  public warning(message: string, location: string, data?: unknown, exc?: Error, ...parameters: unknown[]): void {
    if (this.ensureLoggerLevel(LoggerLevel.WARNING)) {
      this.log(LoggerLevel.WARNING, message, location, data, exc, ...parameters);
    }
  }

  /**
   * Indicates an action performed by the system.
   *
   * @param message Message of the log.
   * @param location Code Location of the log.
   * @param data Additional data to provide context to the log.
   * @param parameters Parameters of the log.
   */
  public information(message: string, location: string, data?: unknown, ...parameters: unknown[]): void {
    if (this.ensureLoggerLevel(LoggerLevel.INFORMATION)) {
      this.log(LoggerLevel.INFORMATION, message, location, data, ...parameters);
    }
  }

  /**
   * Displays information for debugging purposes.
   *
   * @param message Message of the log.
   * @param location Code Location of the log.
   * @param data Additional data to provide context to the log.
   * @param parameters Parameters of the log.
   */
  public debug(message: string, location: string, data?: unknown, ...parameters: unknown[]): void {
    if (this.ensureLoggerLevel(LoggerLevel.DEBUG)) {
      this.log(LoggerLevel.DEBUG, message, location, data, ...parameters);
    }
  }

  /**
   * Granular information about the process executed by the system.
   *
   * @param message Message of the log.
   * @param location Code Location of the log.
   * @param data Additional data to provide context to the log.
   * @param parameters Parameters of the log.
   */
  public trace(message: string, location: string, data?: unknown, ...parameters: unknown[]): void {
    if (this.ensureLoggerLevel(LoggerLevel.TRACE)) {
      this.log(LoggerLevel.TRACE, message, location, data, ...parameters);
    }
  }

  /**
   * Checks if the provided Logger Level is allowed by the Logger.
   *
   * @param loggerLevel Logger Level to be checked.
   */
  private ensureLoggerLevel(loggerLevel: LoggerLevel): boolean {
    return loggerLevel <= this.loggerLevel;
  }
}
