import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { map, Observable } from 'rxjs';

export interface ApiSuccessResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      map((data) => ({
        data,
        message: this.getMessage(request.method, response.statusCode),
        statusCode: response.statusCode,
      })),
    );
  }

  private getMessage(method: string, statusCode: number): string {
    if (statusCode >= 400) {
      return 'Request failed';
    }

    switch (method) {
      case 'POST':
        return 'Resource created successfully';
      case 'PATCH':
      case 'PUT':
        return 'Resource updated successfully';
      case 'DELETE':
        return 'Resource deleted successfully';
      default:
        return 'Request completed successfully';
    }
  }
}
