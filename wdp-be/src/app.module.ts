import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { User, UserSchema } from './commons/schemas/user.schema';
import { Address, AddressSchema } from './commons/schemas/address.schema';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { PolicyController } from './controllers/policy.controller';
import { PolicyService } from './services/policy.service';
import { Policy, PolicySchema } from './commons/schemas/policy.schema';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { Product, ProductSchema } from './commons/schemas/product.schema';
import { CloudinaryService } from './commons/services/cloudinary.service';
import { FileUploadService } from './commons/services/file-upload.service';
import { JwtStrategy } from './auth/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_TOKEN_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get('NODE_ENV') === 'production'
            ? `mongodb+srv://${configService.get('DB_USERNAME')}:${configService.get('DB_PASSWORD')}@${configService.get('DB_HOST')}/${configService.get('DB_NAME')}`
            : configService.get('MONGODB_URI_LOCAL'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      {
        name: Address.name,
        schema: AddressSchema,
      },
      {
        name: Policy.name,
        schema: PolicySchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    PolicyController,
    ProductController,
  ],
  providers: [
    AppService,
    JwtService,
    JwtStrategy,
    AuthService,
    UserService,
    PolicyService,
    ProductService,
    CloudinaryService,
    FileUploadService,
  ],
})
export class AppModule {}
