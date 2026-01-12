import { CustomApiResponse } from '../dtos/custom-api-response.dto';

export function createResponse<T>(
  statusCode: number,
  message: string,
  metadata?: T,
): CustomApiResponse<T> {
  return new CustomApiResponse<T>(statusCode, message, metadata);
}
