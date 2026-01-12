export class CustomApiResponse<T = any> {
  public readonly statusCode: number;

  public message: string;

  public readonly metadata?: T;

  constructor(statusCode: number, message: string, metadata?: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.metadata = metadata;
  }
}
