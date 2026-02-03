import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/commons/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('JWT_ACCESS_TOKEN_SECRET') || 'default-secret',
    });
  }

  async validate(payload: any) {
    const user = await this.userModel.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Convert to plain object and ensure role is a number
    const userObj = user.toObject();
    const role =
      typeof userObj.role === 'string'
        ? parseInt(userObj.role, 10)
        : userObj.role;

    console.log(
      'JWT Strategy - User role from DB:',
      userObj.role,
      'Type:',
      typeof userObj.role,
    );
    console.log('JWT Strategy - Converted role:', role, 'Type:', typeof role);

    return {
      ...userObj,
      role,
    };
  }
}
