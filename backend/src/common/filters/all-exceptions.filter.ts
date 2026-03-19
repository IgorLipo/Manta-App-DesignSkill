import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Sentry } from '@sentry/nestjs';

@Catch()
export class SentryFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    response.status(status).json({
      statusCode: status,
      message: exception instanceof HttpException ? exception.getMessage() : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
