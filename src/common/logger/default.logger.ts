import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class DefaultLogger extends ConsoleLogger {
  warn(message: unknown, ...rest: unknown[]): void {
    console.log('---- Custom Warning ----');
    super.warn(message, ...rest);
  }
}
