import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface Response<T> {
  data: T;
  timesStamp: string;
  path: string;
}
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest<import('express').Request>();

    return next.handle().pipe(
      map((data: T) => ({
        data,
        timesStamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}
