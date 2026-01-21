import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
} from 'src/commons/dtos/auth.dto';
import { CustomApiResponse } from 'src/commons/dtos/custom-api-response.dto';
import * as customApiRequestInterface from 'src/commons/interfaces/custom-api-request.interface';
import { User } from 'src/commons/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  constructor(
    @Inject(REQUEST)
    private readonly request: customApiRequestInterface.ICustomApiRequest,
    @InjectConnection() private readonly connection: Connection,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(
    data: LoginRequestDto,
  ): Promise<CustomApiResponse<LoginResponseDto>> {
    const user = (await this.connection.model(User.name).findOne({
      email: data.email,
    })) as User;
    if (!user) throw new BadRequestException('User not found');

    const isPasswordMatch = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );
    if (!isPasswordMatch) throw new BadRequestException('Invalid password');

    const accessToken = await this.jwtService.signAsync(
      { id: user._id },
      {
        expiresIn: this.configService.get<any>('JWT_ACCESS_TOKEN_EXPIRATION'),
        secret: this.configService.get<any>('JWT_ACCESS_TOKEN_SECRET'),
      },
    );

    return new CustomApiResponse(HttpStatus.OK, 'Login successful', {
      accessToken,
      user,
    });
  }

  async register(data: RegisterRequestDto) {
    const user = (await this.connection.model(User.name).findOne({
      email: data.email,
    })) as User;
    if (user) throw new BadRequestException('User already exists');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const UserModel = this.connection.model(User.name);
    const newUser = new UserModel({
      ...data,
      passwordHash: hashedPassword,
    });

    await newUser.save();

    const accessToken = await this.jwtService.signAsync(
      { id: newUser._id },
      {
        expiresIn: this.configService.get<any>('JWT_ACCESS_TOKEN_EXPIRATION'),
        secret: this.configService.get<any>('JWT_ACCESS_TOKEN_SECRET'),
      },
    );

    return new CustomApiResponse(HttpStatus.OK, 'Register successful', {
      accessToken,
      user: newUser,
    });
  }
}
