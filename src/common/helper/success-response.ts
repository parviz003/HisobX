import { ISuccess } from '../interface';

export function successRes<T = any>(
  data: T,
  statusCode: number = 200,
): ISuccess<T> {
  return {
    statusCode,
    data,
  };
}
