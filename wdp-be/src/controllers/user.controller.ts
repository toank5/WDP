import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
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

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateUserSchema)) userData: CreateUserInput,
  ) {
    return this.userService.create(userData);
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserSchema)) updateData: UpdateUserInput,
  ) {
    return this.userService.update(id, updateData);
  }

  @Post(':id/addresses')
  async addAddress(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddAddressSchema)) addressData: AddAddressInput,
  ) {
    return this.userService.addAddress(id, addressData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
