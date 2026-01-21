import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { User, UserSchema } from './commons/schemas/user.schema';
import { Address, AddressSchema } from './commons/schemas/address.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
    ]),
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, JwtService, AuthService],
})
export class AppModule {}
