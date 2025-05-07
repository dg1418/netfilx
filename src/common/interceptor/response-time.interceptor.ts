import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const requestTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now();
        const diff = responseTime - requestTime;

        console.log(`${request.method} ${request.path} ${diff}ms`);
      }),
    );
  }
}
