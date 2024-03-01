import { Injectable } from '@guarani/di';

import { Logger } from './logger';
import { LoggerLevel } from './logger-level.enum';

/**
 * Default Console Logger of Guarani.
 */
@Injectable()
export class ConsoleLogger extends Logger {
  /**
   * Level of the Logger.
   */
  protected override readonly loggerLevel: LoggerLevel = LoggerLevel.DEBUG;

  /**
   * Logs a message to the console with its parameters based on the provided logger level.
   *
   * @param loggerLevel Level of the message being logged.
   * @param message Message of the log.
   * @param location Code Location of the log.
   * @param parameters Parameters of the log.
   */
  protected log(loggerLevel: LoggerLevel, message: string, location: string, ...parameters: unknown[]): void {
    message = `[${new Date().toISOString()}] ${message}`;

    switch (loggerLevel) {
      case LoggerLevel.CRITICAL:
        console.error(`[Critical] ${message}`, location, ...parameters);
        break;

      case LoggerLevel.ERROR:
        console.error(`[Error] ${message}`, location, ...parameters);
        break;

      case LoggerLevel.WARNING:
        console.warn(`[Warning] ${message}`, location, ...parameters);
        break;

      case LoggerLevel.INFORMATION:
        console.info(`[Information] ${message}`, location, ...parameters);
        break;

      case LoggerLevel.DEBUG:
        console.debug(`[Debug] ${message}`, location, ...parameters);
        break;

      case LoggerLevel.TRACE:
        console.trace(`[Trace] ${message}`, location, ...parameters);
        break;
    }
  }
}
