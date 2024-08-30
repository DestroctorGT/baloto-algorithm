/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import type { Observable } from 'rxjs'

import { Injectable } from '@nestjs/common'
import { map } from 'rxjs/operators'

import { ResponseStatus } from 'src/general/general.enum'

export interface Response<T> {
  statusCode: number
  data: T
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept (context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((result) => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        status: ResponseStatus.Ok,
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        data: has(result, 'data') ? result.data : result,
        count: result?.count,
        currentPage: result?.currentPage,
        nextPage: result?.nextPage,
        prevPage: result?.prevPage,
        lastPage: result?.lastPage
      }))
    )
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const has = (obj: any, key: string) => obj != null && Object.prototype.hasOwnProperty.call(obj, key)
