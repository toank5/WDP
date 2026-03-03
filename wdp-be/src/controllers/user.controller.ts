import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import {
  CreateUserSchema,
  UpdateUserSchema,
  AddAddressSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type AddAddressInput,
} from 'src/commons/validations/user.validation.zod';
import { ZodValidationPipe } from 'src/commons/pipes/zod-validation.pipe';
import { ErrorResponseDto } from '../commons/dtos/error-response.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user account with email and password.',
  })
  @ApiCreatedResponse({
    description: 'User created successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'User created successfully',
        data: {
          _id: 'user-id',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error or email already exists',
    type: ErrorResponseDto,
  })
  async create(
    @Body(new ZodValidationPipe(CreateUserSchema)) userData: CreateUserInput,
  ) {
    return this.userService.create(userData);
  }

  @Get()
  @ApiOperation({
    summary: 'List all users',
    description: 'Retrieves a list of all users in the system.',
  })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Users retrieved successfully',
        data: [
          {
            _id: 'user-id',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'customer',
          },
        ],
      },
    },
  })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves detailed information about a specific user.',
  })
  @ApiOkResponse({
    description: 'User retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'User retrieved successfully',
        data: {
          _id: 'user-id',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
          addresses: [],
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates user information. Supports partial updates.',
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'User updated successfully',
        data: {
          _id: 'user-id',
          name: 'John Smith',
          email: 'john.smith@example.com',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserSchema)) updateData: UpdateUserInput,
  ) {
    return this.userService.update(id, updateData);
  }

  @Post(':id/addresses')
  @ApiOperation({
    summary: 'Add address to user',
    description: 'Adds a new address to the user profile.',
  })
  @ApiCreatedResponse({
    description: 'Address added successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'Address added successfully',
        data: {
          _id: 'address-id',
          street: '123 Main St',
          city: 'New York',
          country: 'USA',
          postalCode: '10001',
          isDefault: true,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async addAddress(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddAddressSchema)) addressData: AddAddressInput,
  ) {
    return this.userService.addAddress(id, addressData);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Deletes a user account.',
  })
  @ApiOkResponse({
    description: 'User deleted successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'User deleted successfully',
        data: { _id: 'user-id', deletedAt: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
