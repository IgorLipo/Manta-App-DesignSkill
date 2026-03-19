import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerService {
  private context?: string;

  constructor(private config: ConfigService) {}

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    console.log(`[${new Date().toISOString()}] INFO ${context || this.context}: ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[${new Date().toISOString()}] ERROR ${context || this.context}: ${message}`, trace);
  }

  warn(message: string, context?: string) {
    console.warn(`[${new Date().toISOString()}] WARN ${context || this.context}: ${message}`);
  }

  debug(message: string, context?: string) {
    if (this.config.get('NODE_ENV') !== 'production') {
      console.debug(`[${new Date().toISOString()}] DEBUG ${context || this.context}: ${message}`);
    }
  }
}
