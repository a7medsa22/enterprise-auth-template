import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

export interface Response<T> {
    data: T,
    timesStamp: string,
    path: string
}
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        const request = context.switchToHttp().getRequest();

        return next.handle().pipe(
            map(data => ({
                data,
                timesStamp: new Date().toISOString(),
                path: request.url
            }))
        )};
}