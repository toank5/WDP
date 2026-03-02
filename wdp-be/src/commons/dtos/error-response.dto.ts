import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard error response structure
 * Used across all API endpoints for consistent error reporting
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message or array of validation error messages',
    example: 'Validation failed',
  })
  message: string | string[];

  @ApiProperty({
    description: 'Application-specific error code',
    example: 'BAD_REQUEST',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'Additional details about validation errors',
    example: [{ path: 'name', message: 'Name is required' }],
    required: false,
  })
  errors?: Array<{ path: string; message: string }>;
}
