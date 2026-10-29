import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import crypto from 'node:crypto';
import type { ApiErrorEnvelope } from '@mimic-manager/types';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const requestId =
      (request.headers['x-request-id'] as string) || crypto.randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected server error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = (obj['message'] as string) || exception.message;
        code = (obj['code'] as string) || (status === 401 ? 'UNAUTHORIZED' : status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST');
        details = obj['details'];
      }
    } else if (exception instanceof Error) {
      message = process.env['NODE_ENV'] === 'production'
        ? 'Internal server error'
        : exception.message;
    }

    const errorPayload: ApiErrorEnvelope = {
      error: {
        code,
        message,
        details,
        requestId,
      },
    };

    response.status(status).send(errorPayload);
  }
}
